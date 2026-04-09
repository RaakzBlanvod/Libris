from fastapi import FastAPI

app = FastAPI(title="Libris API")

@app.get("/")
async def root():
    return {"message": "Libris API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)