# Aggregation Pipeline Sources

This file is the single source of truth for the content aggregation pipeline.

| Status    | Type    | Adapter      | Source Name          | Feed URL                                            | Notes                               |
| :-------- | :------ | :----------- | :------------------- | :-------------------------------------------------- | :---------------------------------- |
| `Pending` | `Job`   | `HIRING_CAFE`| hiring.cafe          | `https://hiring.cafe/api/search-jobs`               | Direct JSON API.                    |
| `Pending` | `Job`   | `RSS`        | aijobs.net           | `https://aijobs.net/feed/`                          | Native RSS feed.                    |
| `Pending` | `Article` | `RSS`        | Google AI Blog       | `http://googleaiblog.blogspot.com/atom.xml`         | Native RSS feed.                    |
| `Pending` | `Article` | `RSS`        | OpenAI Blog          | `https://openai.com/blog/rss.xml`                   | Native RSS feed.                    |
| `Pending` | `Article` | `RSS`        | TechCrunch AI        | `https://techcrunch.com/category/artificial-intelligence/feed/` | Native RSS feed.                    |
| `Pending` | `Article` | `RSS_HUB`    | arXiv (AI)           | `https://<YOUR_RSSHUB_INSTANCE>/arxiv/cs.AI`         | Requires self-hosted RSSHub instance. |
