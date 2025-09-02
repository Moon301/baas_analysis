
from dotenv import load_dotenv
import os
load_dotenv()

from fastapi import APIRouter, Depends, HTTPException, Form
import asyncpg
import logging

import psycopg2
import os, json, decimal, datetime

from app.database.base import get_db

from pydantic import BaseModel, Field
from typing import Literal
from typing_extensions import TypedDict, Annotated

from langgraph.graph.message import add_messages
from langgraph.graph import START, END, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables import RunnableConfig
from langchain_teddynote.messages import invoke_graph, stream_graph, random_uuid
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.prebuilt import ToolNode
from langgraph.prebuilt import tools_condition

import psycopg2
from psycopg2.extras import RealDictCursor


from app.api.v1.ev_code_tools import EV_ANALYTICS_TOOLS

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
select_model = "gpt-oss:20b"



# DB 정보 조회
def get_objects_and_columns():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=5432,
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

    cur = conn.cursor()

    # 1) 테이블/뷰/머뷰 기본 정보
    cur.execute("""
    WITH rels AS (
      SELECT
        n.nspname        AS schema,
        c.relname        AS name,
        CASE c.relkind
          WHEN 'r' THEN 'TABLE'
          WHEN 'v' THEN 'VIEW'
          WHEN 'm' THEN 'MATERIALIZED VIEW'
          ELSE c.relkind::text
        END AS kind,
        pg_total_relation_size(c.oid) AS bytes,
        obj_description(c.oid, 'pg_class') AS comment,
        c.oid AS oid
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r','v','m')
    )
    SELECT schema, name, kind, pg_size_pretty(bytes), COALESCE(comment,''), oid
    FROM rels
    ORDER BY kind, name;
    """)
    objs = cur.fetchall()

    result = {}
    for schema, name, kind, size, comment, oid in objs:
        # 2) 컬럼 정보
        cur.execute("""
        SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod),
               col_description(a.attrelid, a.attnum)
        FROM pg_attribute a
        WHERE a.attrelid = %s AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum;
        """, (oid,))
        cols = [
            {
                "name": cname,
                "type": ctype,
                "comment": ccomment if ccomment else ""
            }
            for cname, ctype, ccomment in cur.fetchall()
        ]

        result[name] = {
            "kind": kind,
            "size": size,
            "comment": comment,
            "columns": cols
        }

    cur.close()
    conn.close()
    return result


def _jsonify_row(v):
    if isinstance(v, decimal.Decimal):
        return float(v)
    if isinstance(v, (datetime.date, datetime.datetime, datetime.time)):
        return v.isoformat()
    return v

class ChatRequest(BaseModel):
    message: str
    model: str = "gpt-oss:20b"

class ChatResponse(BaseModel):
    response: str
    model_used: str
    success: bool
    
    
class EvState(TypedDict):
    messages: Annotated[list, add_messages]
    user_question: Annotated[str, "Question"]  # 사용자 질문
    db_query:  Annotated[str, "DB Query"]  # DB 쿼리 생성
    db_info: Annotated[str, "DB Info"]  # DB 정보
    db_result: Annotated[str, "DB Answer"]  # DB 쿼리 답변
    next_node: Annotated[str, "Next Node"]  # 다음 노드
    

class RouteQuery(BaseModel):

    # 데이터 소스 선택을 위한 리터럴 타입 필드
    binary_score: Literal["yes", "no"] = Field(
        ...,
        description="Given a user question, 전기차, 배터리등과 같은 질문이면 'yes'를 반환하고 그렇지 않으면 'no'를 반환하세요.",
    )


class EvRouterQuery(BaseModel):
    next_node: Literal["code", "database", "general" ] = Field(
        ...,
        description="사용자가 질문한 내용에 대해서 코드를 생성해달라는 경우 'code'를 반환하고, 전기차 성능진단 시스템에 대한 질문이면 'database'를 반환하세요. 사용자의 질문의도를 잘 모르겠으면 'general'을 반환하세요.",
    )

# router
def general_router(state: EvState) -> EvState:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    structured_llm_router = llm.with_structured_output(RouteQuery)
    
    # 시스템 메시지와 사용자 질문을 포함한 프롬프트 템플릿 생성
    system = """
        You are an expert at routing a user question.  
        당신은 EV Performance(전기차 성능진단 시스템)의 관리자입니다.  

        다음과 같은 주제와 관련된 질문이면 반드시 'yes'를 반환하세요:  
        ## SOH / 배터리 건강 관련 
           ### 질문 예시
            - 배터리 SOH가 가장 낮은 차량은 언제인가요?
            - **SOH 상위 10%**에 드는 차량은 어떤 차들인가요?
            - 최근 30일 동안 SOH가 가장 많이 하락한 차량은 무엇인가요?
            - 차종별 평균 SOH를 비교해 주세요.
            - 연식(모델 연도)별 평균 SOH 추이를 알려주세요.
            - 내 차량과 동일 차종 대비 SOH 편차는 어느 정도인가요?
        
        ## 주행/효율
            - 가장 주행거리가 긴 차량은 어떤 차종인가요?
            - 주행 구간별 평균 속도를 알고 싶어요.
            - 주행 효율(SOC/km)이 가장 좋은 차량 Top 5를 알려주세요.
            - 주행 효율의 일관성(표준편차)**이 높은(불안정한) 차량은 무엇인가요?
            
        ## 충전 효율 / 충전 습관
            - 충전 세션이 가장 많은 차량 Top 3를 알려주세요.
            - 급속 충전 효율이 80% 이상인 차량은 몇 대인가요?
            - 완속/급속 충전 효율(%) 중앙값을 차량별로 비교해 주세요.
            
        ## 온도 / 열관리
            - 온도 평균의 표준편차가 큰(변동이 심한) 차량은 누구인가요?
            - 평균 온도 변동 안정성이 가장 높은 차량은 무엇인가요?
            - 평균 시작 SOC가 가장 높은 차량은 무엇인가요?
            - 평균 종료 SOC가 가장 높은 차량은 무엇인가요?
            
        ## 셀 밸런싱(전압 편차)
            - 차종별 평균 전압 편차를 비교해 주세요.
            - 전압 편차가 가장 큰 차량은 누구인가요?
            - 전압 편차가 가장 작은 차량 Top 3를 알려주세요.
            - 전압 편차가 가장 큰 차량 Top 3를 알려주세요.
            
        ## 구간/세션 단위 분석  
            - 가장 긴 주행 구간(시간 기준/거리 기준)은 무엇인가요? 
            - 가장 긴 충전 세션과 그때의 충전 효율은 얼마였나요?
            - SOC가 10% 이상 감소한 주행 구간들의 평균 속도를 알려주세요.
        
        ## 데이터 관련 일반 질문 
        - 차량종류가 몇개야?, 차량 현황이 어떻게 돼?
        - 전기차 데이터 조회 
        - 배터리 성능, 전기차 성능, 배터리 효율  
        - 분석 차량, 전기차량 종류  
        - 충전 변화, 구간 변화, 주행거리 관련 분석  
        - 충전 구간, SOH, 충전 습관, 셀 밸런싱 분석  
        - 충전 효율, 전기차 모델  
        - 차량에 관한 질문
        - 기타 전기차 관련 질문

        위 항목들의 내용이 아니더라도 전기차, 차량, 데이터, 배터리나, 코드 생성, 조회, 분석, 조건 등의 내용이 있으면 'yes'를 반환하세요.
        그 외의 일상적인 질문에 대해서만 'no'를 반환하세요.
        출력은 오직 'yes' 또는 'no'만 가능합니다.  
    """

    # Routing 을 위한 프롬프트 템플릿 생성
    route_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            ("human", "{question}"),
        ]
    )

    # 프롬프트 템플릿과 구조화된 LLM 라우터를 결합하여 질문 라우터 생성
    question_router = route_prompt | structured_llm_router
    response = question_router.invoke(state["user_question"])
    
    if response.binary_score == "yes":
        return "ev_node"
    else:
        return "general_answer"

def ev_node(state: EvState) -> EvState:
    logger.info("EV 라우터 노드 실행")
    system = """
        You are an expert at routing a user question. 
        당신은 EV Performance(전기차 성능진단 시스템)의 관리자입니다.  
        
        사용자가 질문한 내용이 코드, 쿼리를 작성해달라는 경우 'code'를 반환하고 
        
        전기차 성능진단 시스템에 대한 질문이면 'database'를 반환하세요.
        
        사용자의 질문의도를 잘 모르겠으면 'general'을 반환하세요.
        
        
    """
    route_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            ("user", "{question}"),
        ]
    )
    
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    structured_llm_router = llm.with_structured_output(EvRouterQuery)
    chain = route_prompt | structured_llm_router
    response = chain.invoke({"question": state["user_question"]})

    next_node = response.next_node
    
    print("="*100)
    print(next_node)
    
    return {"next_node": next_node}

def ev_router(state: EvState) -> EvState:
    
    next_node = state["next_node"]
    
    if next_node == "code":
        return "code_node"
    elif next_node == "database":
        return "db_node"
    else: 
        return "general_answer" 

# 일반 답변 노드
def general_answer(state: EvState) -> EvState:
    logger.info("일반 답변 노드 실행")
    system_prompt = """
    당신은 친절한 상담사 KETI 입니다. 
    사용자의 질문에 대해 친절하게 답변해주세요.
    그리고 당신은 전기차 성능진단 시스템의 챗봇임을 알려주세요.
    
    사용자가 전기차 성능진단 챗봇의 내용의 질문을 할 수 있게 유도하세요.
    
    너는 다음과 같은 질문을 답변할 수 있어
    1. 배터리 성능이 가장 좋은 자동차가 무엇이야?
    2. 현재 데이터에서 주행구간만 추출하는 SQL코드를 작성해줘
    3. 배터리 건강상태(soh) 가장 낮은 자동차는 뭐야
    4. 주행거리가 가장 많은 자동차를 알려줘
    
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("user", "다음 질문에 대한 답변을 생성해주세요: {question}"),
        ]
    )
    chain = prompt | ChatOllama(model=select_model)
    
    response = chain.invoke({"question": state["user_question"]})
    return {"messages": response}


def code_node(state: EvState) -> EvState:
    logger.info("코드 생성 노드 실행")
    
    db_info = get_objects_and_columns()
    
    system_prompt = """
    You are an expert SQL assistant for EV battery analytics.
    STRICT MODE: Obey every rule below exactly.

    DATABASE SCHEMA (public):
    {db_info}

    GOAL:
    - Generate ONE PostgreSQL SELECT query that answers the user’s request.

    HARD RULES:
    1) Use ONLY tables, views, and columns that appear in the schema above. Do NOT invent or reference anything else.
    2) Follow column meanings/units exactly as described in the schema.
    3) Output MUST be ONLY a single SQL statement inside one code block: ```sql ... ```
    - No explanations, no comments outside the code block, no Markdown except the single SQL code block.
    4) SELECT-only. Do NOT use DDL/DML (NO CREATE/INSERT/UPDATE/DELETE/TRUNCATE/ALTER).
    5) Prefer explicit column lists over SELECT *.
    6) If time filters or IDs are ambiguous, still return a runnable query and place clear TODO comments INSIDE the SQL (e.g., -- TODO: set date range).
    7) If the request is impossible with the given schema, output a single SQL comment INSIDE the code block explaining why (and nothing else).
    - Do not invent tables or columns not in the schema.
    - Always respect the column descriptions, units, and data types.
    - Return only a valid SQL query (no prose, no markdown, no extra text).

    OUTPUT FORMAT:
    - Exactly one code block containing exactly one SQL statement (or one SQL comment if impossible).
    
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("user", "{question}"),
        ]
    )
    
    llm =ChatOllama(model=select_model)
    chain = prompt | llm
    response = chain.invoke({"question": state["user_question"], "db_info": db_info})
    return {"db_query": response.content, "db_info": db_info}


def code_answer(state: EvState) -> EvState:
    logger.info("코드 답변 노드 실행")
    
    system_prompt =  """
    당신은 전기차 데이터 전문가입니다
    주어진 정보를 바탕으로 사용자에게 코드와 해당 코드의 내용을 설명해주세요.
    
    데이터베이스 정보:
    {db_info}

    생성된 코드:
    {db_query}
    
    사용자에게 친절한 코드 설명을 부탁드립니다.
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("user", "{question}"),
        ]
    )
    
    llm =ChatOllama(model=select_model)
    chain = prompt | llm
    response = chain.invoke({"question": state["user_question"], "db_info": state["db_info"], "db_query": state["db_query"]})
    return {"messages": response}

def db_info_node(state: EvState) -> EvState:
    logger.info("DB 체크 노드 실행")
    db_info = get_objects_and_columns()
    
    system_prompt = """
    당신은 전기차 배터리 데이터를 분석하는 전문가용 SQL 어시스턴트입니다.

    다음 스키마를 가진 PostgreSQL 데이터베이스에 접근할 수 있습니다.
    아래에 나열된 테이블, 뷰, 컬럼만 사용하십시오.
    SQL을 작성할 때 컬럼 설명(단위, 의미)을 정확히 준수하십시오.

    DB 스키마 (public):
    {db_info}

    사용자가 질문했을 때의 작업 절차:
    1. 사용자의 질문을 주의 깊게 읽습니다.
    2. 해당 질문에 답변하는 데 필요한 스키마의 테이블과 컬럼을 식별합니다.
    3. 식별한 테이블/컬럼만 사용하여 적절한 SQL 쿼리를 생성합니다.
    4. 설명이나 자연어 답변은 제공하지 말고, SQL 쿼리만 반환합니다.
    5. 질문이 주어진 스키마로는 답변 불가능하다면, 아래 형태의 SQL 주석만 출력합니다:
    -- Question cannot be answered with the given schema

    규칙:
    - 스키마에 없는 테이블이나 컬럼을 만들어내지 마십시오.
    - 컬럼의 설명, 단위, 데이터 타입을 반드시 준수하십시오.
    - 유효한 SQL 쿼리만 반환하십시오(프로즈, 마크다운, 추가 텍스트 금지).
    - 전체 조건이 아닌 특정 조건으로 필터링해 주세요.
    - 데이터 과부하를 방지하기 위해 SQL 쿼리에는 반드시 LIMIT 20을 포함해 주세요.
    
    
    DB 조회 참고사항:
    
    사용자가 전체 데이터의 조회를 요청하면 아래 예시와 같이 조회해 주세요:
    
    ###사용자 질문 예시
        - 총 데이터 행이 얼마야? (total_data_rows)
        - 구간별 상태 분포가 어떻게돼( 주행구간이 몇 퍼센트야?, 구간별 비율 등
        - 전체 차량이 몇대야?
        - 총 차량수가 얼마야?
        - 수집기간은 얼마나 돼?
        
    ### 사용 테이블: bw_dashboard
    
    ### 사용 예시 
        
    
    # 모델별 차량 종류는 car_type 테이블을 참고해 주세요.
    # 차량별 배터리 용량은 ev_battery_capacity 테이블을 참고해 주세요.
    # 배터리 성능 관련 데이터는 battery_performance_ranking 테이블을 참고하세요.
    
    """
    
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system",system_prompt),
            ("user", "Generate a SQL query to answer the following question: {question}"),
        ]
    )
    chain = prompt | ChatOllama(model=select_model)
    response = chain.invoke({"question": state["user_question"],"db_info": db_info})
    return {"db_query": response.content}

# SQL 쿼리 실행 노드
def db_query_excute(state: EvState) -> EvState:
    logger.info("DB 조회 노드 실행")
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=5432,
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    
    try:
        with conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = state["db_query"].replace("```sql", "").replace("```", "").strip()
            cur.execute(query)
            rows = cur.fetchall() 
            
        # JSON 직렬화 가능한 형태로 변환 (Decimal, datetime 등 처리)
        records = [{k: _jsonify_row(v) for k, v in row.items()} for row in rows]
        
        return {"db_result": records}
    finally:
        cur.close()
        conn.close()

def db_answer(state: EvState) -> EvState:
    # db_result가 파이썬 객체라면 모델에선 문자열이 다루기 쉬움
    db_payload = state["db_result"]
    
        # 이미 리스트[dict]면 pretty json으로
    db_text = json.dumps(db_payload, ensure_ascii=False, default=str)

    system_msg = """당신은 EV 배터리 데이터 분석가입니다. 아래 지침을 엄격히 따르세요.

    - 주어진 db_result(쿼리 결과)만을 근거로, 사용자의 질문에 대해 간결하고 보기 좋은 한국어 리포트를 작성합니다.
    - 리포트는 Markdown으로 작성하되, 명료하고 전문적으로 서술합니다.

    [핵심 규칙]
    1) db_result 밖의 외부 지식/가정/추측을 사용하지 마세요.
    2) 필요한 경우 db_result 값으로 간단한 통계(평균/중앙값/최솟값/최댓값/개수)를 계산해 서술하되, SQL/코드/수식은 본문에 출력하지 마세요.
    3) 데이터가 부족하면 무엇이 더 필요한지 구체적으로 말하세요.
    4) 추정이 포함되면 반드시 '추정'이라고 명시하세요.
    5) 시간 표기: 가능하면 YYYY-MM-DD HH:MM.
    6) 새 SQL이나 추가 쿼리 제안은 금지합니다. 단, 마지막 섹션에 이미 실행된 쿼리가 제공된 경우 그대로 보여주되 수정/보완/생성하지 마세요. 제공되지 않으면 해당 섹션을 생략하세요.

    [출력 형식]  ※ 섹션 제목은 그대로 사용하세요.
    ## 요약
    - 2~3줄로 핵심 결론만 제시.

    ## 핵심 지표
    - 총 행 수: N
    - 가능한 경우에만 간략 통계(평균/중앙값/최솟값/최댓값 등 2~4개).

    ## 관찰/인사이트
    - 불릿 3~5개로 사실 중심의 관찰만 적습니다(패턴/변동/이상치 등). 과장 금지.

    ## 한계/추가 필요
    - 질문에 완전 답변이 어려우면 필요한 컬럼/조건/기간 등 1~3개를 구체적으로 제시합니다.

    ## 사용한 DB 쿼리
    - 아래에 제공된 를 그대로 보여주세요. 제공되지 않았다면 이 섹션을 생략하세요.

    ### 사용한 컬럼·지표 요약
    - 본문에서 활용한 핵심 컬럼명과 지표(예: 평균, 중앙값, 그룹 기준)를 1줄로 요약.
    
    
    사용된 DB 쿼리:
    {db_query}
    """
    

    user_msg = (
        "다음은 DB 조회 결과입니다.\n"
        "```json\n{db_result}\n```\n\n"

        """
        요청: 위 db_result만을 근거로 간결하게 답하세요. SQL/코드나 추가 쿼리는 제안하지 마세요.
        """
        "사용자 질문:\n{question}\n\n"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_msg),
        ("user", user_msg),
    ])

    chain = prompt | ChatOllama(model=select_model) 
    response = chain.invoke({
        "question": state["user_question"],
        "db_result": db_payload, 
        "db_query": state["db_query"]
    })

    return {"messages": response}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    message: str = Form(...),
    model: str = Form("gpt-oss:20b"),
    db: asyncpg.Connection = Depends(get_db)
):
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
    os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
    os.environ["LANGSMITH_PROJECT"] = "EV_Chat" 
    load_dotenv()
    
    try:
        logger.info(f"EV Chat 요청 - 모델: {model}, 메시지: {message[:100]}...")
        
        select_model = model
        # Agent로 질문 처리
        # response = await 
        workflow = StateGraph(EvState)

        # 노드를 추가합니다.
        
        workflow.add_node("general_router", general_router)
        workflow.add_node("general_answer", general_answer)
        
        
        workflow.add_node("ev_node", ev_node)
        workflow.add_node("code_node", code_node)
        workflow.add_node("code_answer", code_answer)
        
        workflow.add_node("db_info_node", db_info_node)
        workflow.add_node("db_query_excute", db_query_excute)
        workflow.add_node("db_answer", db_answer)


        workflow.add_conditional_edges(
            START,
            general_router,
            {
                "ev_node": "ev_node",
                "general_answer": "general_answer"
            }
        )
        
        # ev_router에서 3개 조건으로 라우팅
        workflow.add_conditional_edges(
            "ev_node",
            ev_router,
            {
                "code_node": "code_node",
                "db_node": "db_info_node", 
                "general_answer": "general_answer"
            }
        )
        
        
        workflow.add_edge("code_node", "code_answer")
        
        workflow.add_edge("db_info_node", "db_query_excute")
        workflow.add_edge("db_query_excute", "db_answer")
        
        workflow.add_edge("general_answer", END)
        workflow.add_edge("code_answer", END)
        workflow.add_edge("db_answer", END)


        # 기록을 위한 메모리 저장소를 설정합니다.
        memory = MemorySaver()

        # 그래프를 컴파일합니다.
        app= workflow.compile(checkpointer=memory)


        # config 설정(재귀 최대 횟수, thread_id)
        config = RunnableConfig(recursion_limit=20, configurable={"thread_id": random_uuid()})


        # 질문 입력
        inputs = EvState(user_question=message)

        # 그래프 실행
        response = app.invoke(inputs, config)
        
        response = response["messages"][-1].content
        
        logger.info(f"EV Chat 응답: {response}")
        
        logger.info(f"EV Chat 응답 생성 완료 - 길이: {len(response)}")
        
        return ChatResponse(
            response=response,
            model_used=model,
            success=True
        )
        
    except Exception as e:
        logger.error(f"EV Chat 처리 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"채팅 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    EV Chat 서비스 상태 확인
    """
    return {
        "status": "healthy",
        "service": "ev-chat-agent",
        "version": "1.0.0"
    }
