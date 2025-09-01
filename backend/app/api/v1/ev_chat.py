"""
EV Chat API 엔드포인트
LangGraph Agent를 사용한 전기차 데이터 분석 채팅
"""

from fastapi import APIRouter, Depends, HTTPException, Form
from pydantic import BaseModel
import asyncpg
import logging
from app.database.base import get_db
import psycopg2
import  psycopg2
from dotenv import load_dotenv
from typing_extensions import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langgraph.graph import START, END, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables import RunnableConfig
from langchain_teddynote.messages import invoke_graph, stream_graph, random_uuid
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import Literal
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()


# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
select_model = "gpt-oss:20b"
class ChatRequest(BaseModel):
    message: str
    model: str = "gpt-oss:20b"

class ChatResponse(BaseModel):
    response: str
    model_used: str
    success: bool
    
    
class EvState(TypedDict):
    messages: Annotated[list, add_messages]
    db_info: Annotated[list, "DB Info"]  # DB 정보
    user_question: Annotated[str, "Question"]  # 사용자 질문
    db_query:  Annotated[str, "DB Query"]  # DB 쿼리 생성
    db_result: Annotated[str, "DB Answer"]  # DB 쿼리 답변
    

class RouteQuery(BaseModel):

    # 데이터 소스 선택을 위한 리터럴 타입 필드
    binary_score: Literal["yes", "no"] = Field(
        ...,
        description="Given a user question, 전기차, 배터리등과 같은 질문이면 'yes'를 반환하고 그렇지 않으면 'no'를 반환하세요.",
    )


# router
def router_question_node(state: EvState) -> EvState:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    structured_llm_router = llm.with_structured_output(RouteQuery)
    
    # 시스템 메시지와 사용자 질문을 포함한 프롬프트 템플릿 생성
    system = """You are an expert at routing a user question. 전기차, 배터리등과 같은 질문이면 'yes'를 반환하고 그렇지 않으면 'no'를 반환하세요."""

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
        return "db_search"
    else:
        return "general_answer"
# 노드

# 일반 답변 노드
def general_answer(state: EvState) -> EvState:
    
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "당신은 친절한 상담사 KETI 입니다. 사용자의 질문에 대해 친절하게 답변해주세요."),
            ("user", "다음 질문에 대한 답변을 생성해주세요: {question}"),
        ]
    )
    chain = prompt | ChatOllama(model=select_model)
    
    response = chain.invoke({"question": state["user_question"]})
    return {"messages": response}


# DB 테이블 조회 노드

def db_search(state: EvState) -> EvState:
    cur = conn.cursor()

    cur.execute(
    """
    SELECT c.relname AS object_name,
        d.description
    FROM pg_class c
    LEFT JOIN pg_description d ON d.objoid = c.oid
    WHERE c.relkind IN ('r','m','v')  -- r=table, m=matview, v=view
    AND c.relnamespace = 'public'::regnamespace;
    """
    )

    tables = cur.fetchall()

    table_list = [t[0] for t in tables]
    print("Public 스키마 테이블 목록:", table_list)

    cur.close()
    conn.close()
    
    return {"db_info": table_list}




# DB 쿼리 생성 노드
def generate_query(state: EvState) -> EvState:
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a helpful assistant that generates 포스트그래 SQL queries. 다른 설명은 하지말고 쿼리문만 생성해"),
            ("user", "Generate a SQL query to answer the following question: {question}"),
        ]
    )
    chain = prompt | ChatOllama(model=select_model)
    response = chain.invoke({"question": state["user_question"]})
    return {"db_query": response.content}


# DB 조회 노드
def db_query(state: EvState) -> EvState:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        dbname='postgres',
        user='postgres',
        password='keti1234!'
    )
    cur = conn.cursor()
    
    query = state["db_query"].replace("```sql", "").replace("```", "").strip()
    cur.execute(query)
    result = cur.fetchall()

    cur.close()
    conn.close()
    return {"db_result": result}

# 분석 답변 노드
def analyze_answer(state: EvState) -> EvState:
    
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "DB에서 조회된 다음 내용을 보고 사용자가 질문을 분석한 내용을 답변하세요.  db_result:\n{db_result}"),
            ("user", "Generate a SQL query to answer the following question: {question}"),
        ]
        )
    chain = prompt | ChatOllama(model=select_model)
    response = chain.invoke({"question": state["user_question"],"db_result": state["db_result"] })

    
    return {"messages": response}


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    message: str = Form(...),
    model: str = Form("gpt-oss:20b"),
    db: asyncpg.Connection = Depends(get_db)
):

    try:
        logger.info(f"EV Chat 요청 - 모델: {model}, 메시지: {message[:100]}...")
        
        select_model = model
        # Agent로 질문 처리
        # response = await 
        workflow = StateGraph(EvState)

        # 노드를 추가합니다.
        workflow.add_node("router_question_node", router_question_node)
        workflow.add_node("general_answer", general_answer)
        workflow.add_node("db_gen_query", db_query)
        workflow.add_node("generate_query", generate_query)
        workflow.add_node("analyze_answer", analyze_answer)


        workflow.add_conditional_edges(
            START,
            router_question_node,
            {
                "db_search": "generate_query",
                "general_answer": "general_answer"
            }
        )
        workflow.add_edge("generate_query", "db_gen_query")
        workflow.add_edge("db_gen_query", "analyze_answer")
        workflow.add_edge("analyze_answer", END)
        workflow.add_edge("general_answer", END)


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
