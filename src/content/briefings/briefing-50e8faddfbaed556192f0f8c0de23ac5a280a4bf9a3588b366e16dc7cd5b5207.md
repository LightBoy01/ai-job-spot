---
id: briefing-50e8faddfbaed556192f0f8c0de23ac5a280a4bf9a3588b366e16dc7cd5b5207
title: New DynamoDB Key Feature &amp; Why It Matters
slug: briefing-50e8faddfbaed556192f0f8c0de23ac5a280a4bf9a3588b366e16dc7cd5b5207
author: Jason Butz
publishDate: 2025-11-24T22:00:00.000Z
contentType: briefing
sourceName: DEV Community
originalUrl: 'https://dev.to/aws-builders/new-dynamodb-key-feature-why-it-matters-38ln'
status: pending_review
tags:
  - aws
  - nosql
excerpt: >-
  AWS announced multi-attribute composite keys for DynamoDB global secondary
  indexes on November 19th. That's a lot of words, but what does it actually
  mean? It means it's easier to pull data out of Dyn
---
<p>AWS <a href="https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-dynamodb-multi-attribute-composite-keys-global-secondary-indexes/" rel="noopener noreferrer">announced multi-attribute composite keys for DynamoDB global secondary indexes on November 19th</a>. That's a lot of words, but what does it actually mean? It means it's easier to pull data out of DynamoDB in ways you hadn't planned initially, without a bunch of extra work. To fully explain why, I need to explain keys in DynamoDB. I'll assume you know that DynamoDB is a NoSQL database, that the "database" is called a <em>table</em>, and the table is a collection of items, which you can think of as records or rows.</p>

<h2>
  
  
  Primary Key, Partition Key, Sort Key
</h2>

<p>You'll hear many names used for different keys in DynamoDB. It all makes sense, but it can be confusing. Every item in your table has a primary key, as you are probably used to with relational databases such as MySQL, PostgreSQL, Microsoft SQL Server, Oracle, and many others. That primary key is a unique value you can use to retrieve a particular item. In DynamoDB, the primary key can consist of either a single attribute or two attributes.</p>

<p>Your primary key always has a partition key (PK), sometimes called a hash key or hash attribute. The partition key is used by DynamoDB to distribute your items across partitions, enabling the performance for which DynamoDB is known. There are a whole lot of best practices for choosing a partition key, but you don't need to know them right now.</p>

<p>Your primary key might include a sort key (SK), sometimes called a range key or range attribute. If your primary key has a sort key, then it is known as a <em>composite primary key</em>. With a composite primary key, multiple items can have the same partition key. The combination of the partition key and sort key is what must be unique. The sort key determines how values returned are sorted when you query for the items with a given partition key.</p>

<p>Below is a screenshot using sample data AWS provides that shows an example table with only a partition key. In the example, the partition key is the user's username, <em>LoginAlias</em>, as shown in the screenshot. This allows you to easily retrieve a user's information if you know their login alias.</p>

<p><a href="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fj5f2402gmscowm8pusy4.png" class="article-body-image-wrapper"><img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fj5f2402gmscowm8pusy4.png" alt="Table showing data, with the columns labeled" width="800" height="469"></a></p>

<p>The following screenshot shows the same data, with the partition key as the user's first name and the sort key as their last name. This allows you to easily find users by name, for example, all users named <em>Jane</em>.</p>

<p><a href="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fk473ioqgjvtautr64ui6.png" class="article-body-image-wrapper"><img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fk473ioqgjvtautr64ui6.png" alt="Table showing data, with the columns labeled" width="800" height="469"></a></p>

<h2>
  
  
  Get, Query, Scan
</h2>

<p>Before I get into key structures, I have to cover the three primary operations for reading data from DynamoDB. You can either use a <code>GetItem</code> action to read a single item, use the <code>Query</code> API to retrieve multiple items based on primary key values, or use the <code>Scan</code> operation.</p>

<p>For <code>GetItem</code>, you provide the entire primary key, and DynamoDB returns your item. It's very straightforward and <em>very</em> fast.</p>

<p>For a query, you must know the partition key value, but you can perform more complex comparisons for the sort key value, as well as for other attributes on the items. Using the screenshot above as an example, you could query for all users with the first name "Jane" and a last name that begins with "R", or for all users with the first name "Jane" who have "software" as a skill. Query operations are generally very fast, thanks to knowing exactly which partition to access for the data.</p>

<p>Scan operations don't require you to know the primary key, but they are much slower and far less efficient than other operations. You can apply filter expressions to limit the data returned, but this happens after the data is read. A scan operation reads out 1MB of data from your table, then applies any filter expression. If that doesn't return your results, you will need to paginate and scan the next batch of data. In effect, you are reading your entire table to get the data you want. You should avoid scans whenever possible.</p>

<p>After reviewing these operations, you can see why we want to focus on <code>GetItem</code> and query operations, but both require us to know the partition key. Now you can see why key structure matters. There is one more topic to cover before we really focus on key structures: indexes.</p>

<h2>
  
  
  Secondary Indexes
</h2>

<p>DynamoDB has a feature called <em>secondary indexes</em>. They are effectively copies of your table that you read from the same way, but organized differently. There are two types: <em>global secondary indexes</em> (GSI) and <em>local secondary indexes</em> (LSI). A local secondary index uses the same partition key as your base table, but you can configure a different sort key. A global secondary index can have a different partition key and sort key from your base table.</p>

<p>There are additional considerations with secondary indexes, but those are outside the scope of this discussion.</p>

<h2>
  
  
  Key Structures
</h2>

<p>You've seen how important the partition key is for your data. A standard line you used to hear from AWS about DynamoDB performance was the importance of "well-structured queries". If you don't know your partition key, your query is not well-structured. GSIs let you define new partition keys and offer a lot of flexibility, but you still need to know the partition key for each GSI.</p>

<p>The importance of your partition key is why you need to understand your data and data access patterns before developing your DynamoDB table. If you will always know your user's username once they log in, then it may be a good partition key to use. If you have a multi-tenant application and will always know the tenant ID associated with a user, then that may be a good partition key.</p>

<p>Sort keys are where things get interesting. Using someone's last name as a sort key works for a basic example, but real applications are rarely that simple. Perhaps you are tracking details and audit records for different pieces of equipment. That's two different kinds of data about your equipment, in the same table. Your equipment ID could serve as your partition key, and you could use "details" as your sort key for the equipment information. For your audit items, you can use version numbers or timestamps as part of your sort key to make them sortable, something like <code>audit_v1</code> or <code>audit_v20251121T121314Z</code>. This lets you keep track of your past audits while also being able to retrieve the most recent one by sorting values. You do need to be careful of possible issues when sorting numbers as strings. For example, <code>audit_v10</code> will come after <code>audit_v1</code> but before <code>audit_v2</code>.</p>

<p>With complex use cases, you may end up using a <em>composite sort key</em> that isn't a single value but instead multiple values concatenated. AWS's documentation uses the following as an example for a table listing geographical data.<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight plaintext"><code>[country]#[region]#[state]#[county]#[city]#[neighborhood]
</code></pre>

</div>

<p>This kind of structure lets you use <code>begins_with</code>, <code>between</code>, and greater than/less than operators to retrieve related groups of data. You can use your partition key and query for all data related to King County, Washington (where Amazon's HQ is) by querying for a sort key beginning with <code>usa#northwest#wa#king#</code> (USA for the country, Northwest for the region, WA meaning Washington state, and King meaning King County). Note that I included the <code>#</code> at the end of the value, which prevents us from picking up extra values due to partial matches.</p>

<p>By combining these ideas, you can have multiple formats for sort keys in the same table. I had one application with a single DynamoDB table containing 12-15 different item types. We had numerous organizations in the same table, with their organization ID as the partition key and sort keys such as <code>organization</code>, <code>user#[user guid]#detail</code>, <code>user#[user guid]#permissions</code>, and more.</p>

<p>The downside to these composite sort keys is that you have to build them yourself when you create your items, setting them as an attribute. AWS doesn't do it for you. Now imagine you're adding a new GSI and want a new composite sort key. Now you have to update every item in your table with the correct value for that sort key. It becomes very challenging; hence, you generally want an in-depth understanding of how your data will be accessed before defining the key structures for your DynamoDB tables.</p>

<h2>
  
  
  Enter Multi-Attribute Key Schemas
</h2>

<p>This is where the AWS announcement comes in. Multi-attribute key schemas are a new feature of GSIs. Instead of needing to manually concatenate and backfill values, the DynamoDB service can do that for you. Instead of writing a process to iterate over your table and update every item with your new attribute for a new partition key and sort key in a new GSI, you tell AWS which attributes you want used in the keys and in what order, and AWS handles it. AWS doesn't actually add a new attribute, but instead lets you retrieve items based on multiple attributes.</p>

<p>AWS uses <code>TOURNAMENT#WINTER2024#REGION#NA-EAST</code> as an example composite key, representing scores from a game tournament. Instead, you specify up to four attributes for your partition key and up to four for your sort key. In this example, <code>tournamentId</code> and <code>region</code> are the partition key. When reading data from the GSI, instead of referencing an attribute you defined with a composite value, you specify the attributes as part of your query. This keeps your data looking cleaner and saves you a headache.</p>

<p>This means instead of defining an item like the code below, with composite keys as attributes.<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight javascript"><code><span class="kd">const</span> <span class="nx">item</span> <span class="o">=</span> <span class="p">{</span>
  <span class="na">matchId</span><span class="p">:</span> <span class="dl">'</span><span class="s1">match-001</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">tournamentId</span><span class="p">:</span> <span class="dl">'</span><span class="s1">WINTER2024</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">region</span><span class="p">:</span> <span class="dl">'</span><span class="s1">NA-EAST</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">round</span><span class="p">:</span> <span class="dl">'</span><span class="s1">SEMIFINALS</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">bracket</span><span class="p">:</span> <span class="dl">'</span><span class="s1">UPPER</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">player1Id</span><span class="p">:</span> <span class="dl">'</span><span class="s1">101</span><span class="dl">'</span><span class="p">,</span>
  <span class="c1">// Synthetic keys needed for GSI</span>
  <span class="na">GSI_PK</span><span class="p">:</span> <span class="s2">`TOURNAMENT#</span><span class="p">${</span><span class="nx">tournamentId</span><span class="p">}</span><span class="s2">#REGION#</span><span class="p">${</span><span class="nx">region</span><span class="p">}</span><span class="s2">`</span><span class="p">,</span>
  <span class="na">GSI_SK</span><span class="p">:</span> <span class="s2">`</span><span class="p">${</span><span class="nx">round</span><span class="p">}</span><span class="s2">#</span><span class="p">${</span><span class="nx">bracket</span><span class="p">}</span><span class="s2">#</span><span class="p">${</span><span class="nx">matchId</span><span class="p">}</span><span class="s2">`</span><span class="p">,</span>
<span class="p">};</span>
</code></pre>

</div>

<p>You define the attributes on your GSI and use your item as-is, without extra concatenation.<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight javascript"><code><span class="kd">const</span> <span class="nx">item</span> <span class="o">=</span> <span class="p">{</span>
  <span class="na">matchId</span><span class="p">:</span> <span class="dl">'</span><span class="s1">match-001</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">tournamentId</span><span class="p">:</span> <span class="dl">'</span><span class="s1">WINTER2024</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">region</span><span class="p">:</span> <span class="dl">'</span><span class="s1">NA-EAST</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">round</span><span class="p">:</span> <span class="dl">'</span><span class="s1">SEMIFINALS</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">bracket</span><span class="p">:</span> <span class="dl">'</span><span class="s1">UPPER</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">player1Id</span><span class="p">:</span> <span class="dl">'</span><span class="s1">101</span><span class="dl">'</span><span class="p">,</span>
  <span class="na">matchDate</span><span class="p">:</span> <span class="dl">'</span><span class="s1">2024-01-18</span><span class="dl">'</span><span class="p">,</span>
<span class="p">};</span>
</code></pre>

</div>

<p>You are limited to four attributes in the partition key and four attributes in the sort key. This applies only to global secondary indexes (GSIs). It is not available for your base table or local secondary indexes (LSIs).</p>

<p>If you want to learn more about what this means for key structures, AWS added a <a href="https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.DesignPattern.MultiAttributeKeys.html" rel="noopener noreferrer">page to their documentation covering multi-attribute key patterns</a>.</p>

<h2>
  
  
  Wrapping Up
</h2>

<p>I'm excited about multi-attribute key schemas because they make DynamoDB easier to use and more flexible without requiring complex backfill work. I've always had to caution people about DynamoDB because of the importance of well-designed key structures. They're still important, but adding new GSIs with different key structures is easier now, and that's a significant improvement.</p>

