import scrapy

class JobItem(scrapy.Item):
    id = scrapy.Field()
    title = scrapy.Field()
    company = scrapy.Field()
    location = scrapy.Field()
    description = scrapy.Field()
    applicationLink = scrapy.Field()
    postedDate = scrapy.Field()
    expirationDate = scrapy.Field()
    salaryRange = scrapy.Field()
    jobLevel = scrapy.Field()
    employeeRole = scrapy.Field()
    isNew = scrapy.Field()
    tags = scrapy.Field()
    source = scrapy.Field()
    responsibilities = scrapy.Field()
    qualifications = scrapy.Field()
