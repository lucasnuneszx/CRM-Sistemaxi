from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException
import logging
from typing import IO, Union
import uuid
from datetime import timedelta

from ..core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MinioService:
    def __init__(self):
        try:
            self.client = Minio(
                endpoint=settings.minio_endpoint,
                access_key=settings.minio_access_key,
                secret_key=settings.minio_secret_key,
                secure=settings.minio_use_ssl
            )
            self.bucket_name = settings.minio_bucket_name
            self._ensure_bucket_exists()
            logger.info(f"MinIO client initialized. Endpoint: {settings.minio_endpoint}, Bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Error initializing MinIO client: {e}")
            # Depending on the desired behavior, you might want to re-raise the exception
            # or handle it in a way that allows the app to start with MinIO disabled.
            self.client = None 
            self.bucket_name = None
            # raise HTTPException(status_code=500, detail=f"Could not initialize MinIO service: {e}")


    def _ensure_bucket_exists(self):
        if not self.client:
            logger.warning("MinIO client not available. Skipping bucket check.")
            return
        try:
            found = self.client.bucket_exists(self.bucket_name)
            if not found:
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Bucket '{self.bucket_name}' created successfully.")
            else:
                logger.info(f"Bucket '{self.bucket_name}' already exists.")
        except S3Error as e:
            logger.error(f"Error checking or creating bucket '{self.bucket_name}': {e}")
            # raise HTTPException(status_code=500, detail=f"MinIO bucket operation failed: {e}")


    def upload_file(self, file: UploadFile, folder: str = "general") -> str:
        if not self.client:
            raise HTTPException(status_code=503, detail="MinIO service is not available.")
        try:
            # Sanitize filename and generate a unique object name
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            object_name = f"{folder.strip('/')}/{uuid.uuid4()}.{file_extension}" if file_extension else f"{folder.strip('/')}/{uuid.uuid4()}"
            
            # Use file.file which is a SpooledTemporaryFile (file-like object)
            file.file.seek(0) # Ensure reading from the beginning
            content_length = file.size

            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file.file,
                length=content_length, # Pass the content length
                content_type=file.content_type
            )
            logger.info(f"File '{file.filename}' uploaded successfully as '{object_name}' to bucket '{self.bucket_name}'.")
            return object_name # Return the object key/name
        except S3Error as e:
            logger.error(f"Error uploading file '{file.filename}' to MinIO: {e}")
            raise HTTPException(status_code=500, detail=f"MinIO upload failed: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred during file upload: {e}")
            raise HTTPException(status_code=500, detail=f"Unexpected error during upload: {e}")

    def get_download_url(self, object_name: str, expires_in_seconds: int = 3600) -> str:
        if not self.client:
            raise HTTPException(status_code=503, detail="MinIO service is not available.")
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=timedelta(seconds=expires_in_seconds)  # Convert to timedelta
            )
            logger.info(f"Generated presigned URL for '{object_name}'.")
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL for '{object_name}': {e}")
            raise HTTPException(status_code=500, detail=f"MinIO URL generation failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL for '{object_name}': {e}")
            raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    def delete_file(self, object_name: str):
        if not self.client:
            raise HTTPException(status_code=503, detail="MinIO service is not available.")
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"File '{object_name}' deleted successfully from bucket '{self.bucket_name}'.")
        except S3Error as e:
            logger.error(f"Error deleting file '{object_name}' from MinIO: {e}")
            raise HTTPException(status_code=500, detail=f"MinIO deletion failed: {e}")

# Global instance of the service
minio_service = MinioService() 