from abc import ABC, abstractmethod
from ebrains_drive import BucketApiClient
from io import StringIO
import requests
from .logger import logger

class Store(ABC):
    @abstractmethod
    def set(self, key: str, value: str): ...

    @abstractmethod
    def get(self, key: str): ...

    @abstractmethod
    def delete(self, key: str): ...

    def is_healthy(self) -> bool:
        raise NotImplementedError

class FallbackStore(Store):
    _mem = {}
    def set(self, key: str, value: str):
        self._mem[key] = value
        
    def get(self, key: str):
        return self._mem.get(key)
    
    def delete(self, key: str):
        self._mem.pop(key, None)

    def is_healthy(self) -> bool:
        return True
    
    _instance: 'FallbackStore' = None
    @classmethod
    def Ephemeral(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        

class RedisEphStore(Store):

    _persistent_store: "RedisEphStore" = None
    _ephemeral_store: "RedisEphStore" = None

    def __init__(self, host: str="localhost", port: int=6379, username: str=None, password: str=None, expiry_s: int=60*60*24) -> None:
        super().__init__()
        from redis import Redis
        self._redis = Redis(host, port, password=password, username=username)
        self.expiry_s = expiry_s
    
    def set(self, key: str, value: str):
        self._redis.set(key, value, ex=self.expiry_s)
    
    def delete(self, key: str):
        self._redis.delete(key)
    
    def get(self, key: str):
        return self._redis.get(key)
    
    def is_healthy(self) -> bool:
        try:
            self._redis.ping()
            return True
        except Exception as e:
            logger.error(f"redis store is not healthy! {str(e)}")
            return False
    
    @classmethod
    def Persistent(cls):
        from .config import REDIS_ADDR, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME
        if cls._persistent_store is None:
            cls._persistent_store = cls(REDIS_ADDR, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD, expiry_s=None)
        return cls._persistent_store
    
    @classmethod
    def Ephemeral(cls):
        from .config import REDIS_ADDR, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME
        if cls._ephemeral_store is None:
            _store = cls(REDIS_ADDR, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD)
            if not _store.is_healthy():
                logger.warn(f"ephstore is not healthy, fall back to mem store instead.")
                return FallbackStore.Ephemeral()
            cls._ephemeral_store = _store
        return cls._ephemeral_store

    @classmethod
    def Get(cls, key: str):
        store = cls.Persistent()
        return store.get(key)

class DataproxyStore(Store):

    class NotFound(Exception): ...
    class GenericException(Exception): ...
    
    ENDPOINT = "https://data-proxy.ebrains.eu/api/v1/buckets/{bucket_name}/{object_name}"

    def __init__(self, token: str, bucket_name: str):
        super().__init__()
        self.token = token
        self.bucket_name = bucket_name
    

    def update_token(self, token: str):
        self.token = token
    

    def _get_bucket(self):
        client = BucketApiClient(token=self.token)
        return client.buckets.get_bucket(self.bucket_name)
        

    def delete(self, key: str):
        bucket = self._get_bucket()
        file = bucket.get_file(key)
        file.delete()
        

    def set(self, key: str, value: str):
        bucket = self._get_bucket()

        sio = StringIO()
        sio.write(value)
        sio.seek(0)
        bucket.upload(sio, key)


    def get(self, key: str):
        try:
            resp = requests.get(DataproxyStore.ENDPOINT.format(bucket_name=self.bucket_name, object_name=key))
            resp.raise_for_status()
            return resp.content.decode("utf-8")
        except DataproxyStore.NotFound as e:
            raise e from e
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise DataproxyStore.NotFound(str(e)) from e
            raise DataproxyStore.GenericException(str(e)) from e
        except Exception as e:
            raise DataproxyStore.GenericException(str(e)) from e
