from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import os
import uuid
import shutil
from pathlib import Path

router = APIRouter(prefix="/baas", tags=["baas"])

# 임시 파일 저장 디렉토리
TEMP_DIR = Path("/tmp/baas_uploads")
TEMP_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """CSV 파일 업로드"""
    try:
        # 파일 확장자 검증
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다.")
        
        # 고유한 파일 ID 생성
        file_id = str(uuid.uuid4())
        temp_path = str(TEMP_DIR / f"{file_id}_{file.filename}")
        
        # 파일 저장
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 파일 크기 확인
        file_size = os.path.getsize(temp_path)
        
        return {
            "success": True,
            "data": {
                "file_id": file_id,
                "filename": file.filename,
                "temp_path": temp_path,
                "size": file_size
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 업로드 실패: {str(e)}")

@router.post("/chat")
async def chat_with_baas(
    message: str = Form(...),
    model: Optional[str] = Form("gpt-4")
):
    """BaaS 채팅 API"""
    try:
        # 선택된 모델에 따른 응답 생성
        model_responses = {
            "gpt-4": "GPT-4 모델을 사용하여 응답을 생성했습니다. 이 모델은 고품질의 상세한 분석을 제공합니다.",
            "gpt-3.5-turbo": "GPT-3.5 Turbo 모델을 사용하여 빠르고 효율적인 응답을 생성했습니다.",
            "claude-3": "Claude 3 모델을 사용하여 창의적이고 정확한 응답을 생성했습니다.",
            "gemini-pro": "Gemini Pro 모델을 사용하여 Google의 최신 AI 기술로 응답을 생성했습니다.",
            "llama-3": "Llama 3 모델을 사용하여 오픈소스 AI로 응답을 생성했습니다."
        }
        
        # 기본 응답
        response_content = f"사용자 메시지: {message}\n\n"
        response_content += f"선택된 모델: {model}\n"
        response_content += f"모델 설명: {model_responses.get(model, '알 수 없는 모델')}\n\n"
        
        # 전기차 관련 질문에 대한 예시 응답
        if "전기차" in message or "배터리" in message or "성능" in message:
            response_content += "🔋 전기차 관련 질문이 감지되었습니다!\n\n"
            response_content += "전기차 데이터 분석에 도움이 될 수 있는 정보를 제공해드리겠습니다:\n"
            response_content += "• 배터리 성능 및 수명\n"
            response_content += "• 주행 효율성 및 범위\n"
            response_content += "• 충전 패턴 및 최적화\n"
            response_content += "• 차량별 성능 비교\n\n"
            response_content += "더 구체적인 질문을 해주시면 더 자세한 분석을 제공할 수 있습니다."
        else:
            response_content += "이것은 BaaS API의 응답입니다. 전기차 관련 질문을 해보세요!"
        
        return {
            "success": True,
            "response": response_content,
            "model_info": {
                "provider": get_model_provider(model),
                "model": model
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅 처리 실패: {str(e)}")

def get_model_provider(model: str) -> str:
    """모델명으로부터 제공업체 반환"""
    if model.startswith("gpt"):
        return "OpenAI"
    elif model.startswith("claude"):
        return "Anthropic"
    elif model.startswith("gemini"):
        return "Google"
    elif model.startswith("llama"):
        return "Meta"
    else:
        return "Unknown"

@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """업로드된 파일 삭제"""
    try:
        # 임시 디렉토리에서 해당 파일 찾기
        for file_path in TEMP_DIR.glob(f"{file_id}_*"):
            os.remove(file_path)
            return {"success": True, "message": "파일이 삭제되었습니다."}
        
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 삭제 실패: {str(e)}")
