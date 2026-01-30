from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Squad API Test")

@app.get("/")
async def root():
    return {"message": "Squad API is running!", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("🚀 Iniciando servidor simples...")
    uvicorn.run(app, host="0.0.0.0", port=3001, log_level="info") 