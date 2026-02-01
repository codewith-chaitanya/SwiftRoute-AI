from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "SwiftRoute Backend is Running!"}

# To run later: uvicorn main:app --reload