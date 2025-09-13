from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime

class JobItem(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    location: Optional[str] = None
    description: str
    applicationLink: HttpUrl
    postedDate: Optional[datetime] = None
    expirationDate: Optional[datetime] = None
    salaryRange: Optional[str] = None
    jobLevel: Optional[str] = None
    employeeRole: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    source: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)

    class Config:
        # This is needed to allow Scrapy to work with Pydantic items
        arbitrary_types_allowed = True