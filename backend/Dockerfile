FROM python:3.11-slim
WORKDIR /fundingpro
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY fundingpro ./fundingpro
CMD ["uvicorn", "fundingpro.main:app", "--host", "0.0.0.0", "--port", "8000"]
