from dotenv import load_dotenv

from typing_extensions import TypedDict, Annotated
from langgraph.graph.message import add_messages

from langgraph.graph import START, END, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables import RunnableConfig
from langchain_teddynote.messages import invoke_graph, stream_graph, random_uuid
import psycopg2

load_dotenv()


class EVChatAgent:
    """EV Chat Agent 클래스"""
    
    def __init__(self, model_name: str = "gpt-oss:20b"):
        self.model_name = model_name
        
    async def get_db_connection(self) -> asyncpg.Connection:
        """데이터베이스 연결 생성"""
        return await asyncpg.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
    
    
    async def process_query(self, user_question: str, db_connection: asyncpg.Connection) -> str:
        """사용자 질문을 처리하고 답변 생성"""
        try:
            logger.info(f"사용자 질문 처리 시작: {user_question}")
            
            # 질문 분석을 위한 시스템 프롬프트
            system_prompt = """
            당신은 전기차 데이터 분석 전문가입니다. 
            사용자의 질문을 분석하여 적절한 데이터베이스 검색을 수행하고, 
            검색 결과를 바탕으로 상세하고 정확한 답변을 제공해주세요.
            
            사용 가능한 검색 기능:
            1. 차량 데이터 검색 (search_vehicle_data): 차량 기본 정보
            2. 배터리 성능 검색 (search_battery_performance): 배터리 성능 랭킹
            3. 주행 패턴 검색 (search_driving_patterns): 주행 및 충전 패턴
            
            답변은 한국어로 제공하며, 검색된 데이터는 표 형태로 정리하여 보여주세요.
            """
            
            # 질문에서 검색 키워드 추출 (간단한 키워드 추출)
            search_keywords = user_question.lower()
            
            # 검색 결과 수집
            search_results = []
            
            # 차량 데이터 검색
            if any(keyword in search_keywords for keyword in ['차량', 'vehicle', 'clientid', '모델']):
                vehicle_data = await self.search_vehicle_data(user_question, db_connection)
                search_results.append(f"차량 데이터:\n{vehicle_data}")
            
            # 배터리 성능 검색
            if any(keyword in search_keywords for keyword in ['배터리', 'battery', '성능', 'performance', '랭킹', 'ranking']):
                battery_data = await self.search_battery_performance(user_question, db_connection)
                search_results.append(f"배터리 성능 데이터:\n{battery_data}")
            
            # 주행 패턴 검색
            if any(keyword in search_keywords for keyword in ['주행', 'driving', '충전', 'charging', '패턴', 'pattern']):
                pattern_data = await self.search_driving_patterns(user_question, db_connection)
                search_results.append(f"주행 패턴 데이터:\n{pattern_data}")
            
            # 검색 결과가 없으면 기본 검색 수행
            if not search_results:
                vehicle_data = await self.search_vehicle_data(user_question, db_connection)
                search_results.append(f"차량 데이터:\n{vehicle_data}")
            
            # LLM을 사용하여 최종 답변 생성
            combined_results = "\n\n".join(search_results)
            
            prompt = f"""
            {system_prompt}
            
            사용자 질문: {user_question}
            
            검색 결과:
            {combined_results}
            
            위 검색 결과를 바탕으로 사용자 질문에 대한 상세하고 정확한 답변을 제공해주세요.
            """
            
            # LLM 호출
            response = await self.llm.ainvoke(prompt)
            
            logger.info(f"LLM 응답 생성 완료: {len(response)} 문자")
            
            return response
            
        except Exception as e:
            logger.error(f"질문 처리 중 오류: {e}")
            return f"죄송합니다. 질문 처리 중 오류가 발생했습니다: {str(e)}"

# Agent 인스턴스 관리
_agent_instances: Dict[str, EVChatAgent] = {}

async def get_ev_chat_agent(model_name: str = "llama3.3:latest") -> EVChatAgent:
    """EV Chat Agent 인스턴스 가져오기 (싱글톤 패턴)"""
    if model_name not in _agent_instances:
        _agent_instances[model_name] = EVChatAgent(model_name)
    return _agent_instances[model_name]