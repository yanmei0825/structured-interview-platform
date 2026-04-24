# Company Analytics API Reference

## Endpoints

### Get Company Report
```
GET /company/:id/report
```

**Parameters:**
- `id` (path): Company ID

**Response:**
```json
{
  "companyId": "company-123",
  "companyName": "Acme Corp",
  "totalProjects": 3,
  "totalSessions": 45,
  "finishedSessions": 42,
  "overallCompletionRate": 93,
  "overallDepthScore": 72,
  "dimensions": [
    {
      "key": "D1",
      "name": "Success",
      "avgCoveragePercent": 95,
      "avgDepthScore": 78,
      "totalRespondents": 45,
      "topSignals": ["achievement", "pride", "success", "delivered", "accomplished"],
      "sentimentTrend": "positive",
      "riskLevel": "low"
    },
    {
      "key": "D2",
      "name": "Security/Value",
      "avgCoveragePercent": 88,
      "avgDepthScore": 65,
      "totalRespondents": 45,
      "topSignals": ["stable", "valued", "fair", "secure", "recognized"],
      "sentimentTrend": "neutral",
      "riskLevel": "medium"
    },
    // ... D3-D10
  ],
  "projectBreakdown": [
    {
      "projectId": "proj-1",
      "projectName": "Engineering Team",
      "sessions": 15,
      "completionRate": 100,
      "depthScore": 75
    },
    {
      "projectId": "proj-2",
      "projectName": "Sales Team",
      "sessions": 15,
      "completionRate": 93,
      "depthScore": 70
    },
    {
      "projectId": "proj-3",
      "projectName": "Support Team",
      "sessions": 15,
      "completionRate": 87,
      "depthScore": 72
    }
  ],
  "keyInsights": [
    "✓ Strong areas: Success, Relationships. Maintain current practices.",
    "⚠️ High-risk areas: Obstacles. Recommend immediate attention.",
    "📊 Coverage gaps in: Learning. Recommend additional interviews.",
    "✓ Overall depth score is strong (72/100). Data quality is good.",
    "⚠️ Negative sentiment detected in 2 dimensions. Consider employee engagement initiatives."
  ],
  "generatedAt": 1704067200000
}
```

**Status Codes:**
- `200 OK` - Report generated successfully
- `404 Not Found` - Company not found
- `500 Internal Server Error` - Server error

## Data Types

### CompanyReport
```typescript
interface CompanyReport {
  companyId: string;
  companyName: string;
  totalProjects: number;
  totalSessions: number;
  finishedSessions: number;
  overallCompletionRate: number;      // 0-100
  overallDepthScore: number;          // 0-100
  dimensions: CompanyDimensionAnalysis[];
  projectBreakdown: ProjectBreakdown[];
  keyInsights: string[];
  generatedAt: number;                // Unix timestamp
}
```

### CompanyDimensionAnalysis
```typescript
interface CompanyDimensionAnalysis {
  key: DimensionKey;                  // D1-D10
  name: string;                       // Dimension name
  avgCoveragePercent: number;         // 0-100
  avgDepthScore: number;              // 0-100
  totalRespondents: number;
  topSignals: string[];               // Top 5 keywords
  sentimentTrend: "positive" | "negative" | "neutral";
  riskLevel: "low" | "medium" | "high";
}
```

### ProjectBreakdown
```typescript
interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  sessions: number;
  completionRate: number;             // 0-100
  depthScore: number;                 // 0-100
}
```

## Metrics Definitions

### Overall Completion Rate
- **Formula**: (Finished Sessions / Total Sessions) × 100
- **Range**: 0-100%
- **Interpretation**:
  - > 80%: Excellent
  - 60-80%: Good
  - 40-60%: Fair
  - < 40%: Poor

### Overall Depth Score
- **Formula**: Average of all dimension depth scores
- **Range**: 0-100
- **Components**:
  - Turn Coverage (50%): (Turns / Max Turns) × 50
  - Signal Density (50%): (min(Signals, 5) / 5) × 50
- **Interpretation**:
  - > 70: Strong data quality
  - 50-70: Moderate data quality
  - < 50: Weak data quality

### Coverage Percent (per dimension)
- **Formula**: (Respondents who covered dimension / Total respondents) × 100
- **Range**: 0-100%
- **Interpretation**:
  - > 80%: Well covered
  - 60-80%: Adequately covered
  - < 60%: Under-covered

### Risk Level
- **LOW**: Coverage > 70% AND (Sentiment positive OR Depth > 60)
- **MEDIUM**: Coverage 50-70% OR (Sentiment negative AND Depth 40-60)
- **HIGH**: Coverage < 50% OR (Sentiment negative AND Depth < 40)

## Sentiment Trends

### Positive
- Indicates favorable responses
- Keywords: proud, achievement, trust, support, growth
- Action: Maintain current practices

### Negative
- Indicates unfavorable responses
- Keywords: frustrated, stressed, ignored, stuck, broken
- Action: Investigate and address issues

### Neutral
- Mixed or balanced responses
- Action: Monitor for changes

## Key Insights Types

### 1. High-Risk Alert
```
⚠️ High-risk areas: {dimensions}. Recommend immediate attention.
```
- Triggered when: Risk level = HIGH for any dimension
- Action: Investigate root causes and implement interventions

### 2. Strong Areas
```
✓ Strong areas: {dimensions}. Maintain current practices.
```
- Triggered when: Depth > 70 AND Coverage > 80 for multiple dimensions
- Action: Document and replicate best practices

### 3. Sentiment Warning
```
⚠️ Negative sentiment detected in {count} dimensions. Consider employee engagement initiatives.
```
- Triggered when: Negative sentiment in 4+ dimensions
- Action: Launch engagement or improvement programs

### 4. Coverage Gap
```
📊 Coverage gaps in: {dimensions}. Recommend additional interviews.
```
- Triggered when: Coverage < 50% for any dimension
- Action: Conduct additional interviews

### 5. Project Performance
```
📉 {count} project(s) have low completion rates. Review interview process.
```
- Triggered when: Completion rate < 50% for any project
- Action: Review and improve interview process

### 6. Data Quality
```
✓ Overall depth score is strong ({score}/100). Data quality is good.
```
- Triggered when: Depth score > 70
- Action: Proceed with confidence in analysis

```
⚠️ Overall depth score is low ({score}/100). Consider longer interviews or follow-ups.
```
- Triggered when: Depth score < 40
- Action: Extend interviews or conduct follow-ups

## Usage Examples

### JavaScript/TypeScript
```typescript
// Fetch company report
const response = await fetch('/company/company-123/report');
const report = await response.json();

// Access metrics
console.log(`Completion Rate: ${report.overallCompletionRate}%`);
console.log(`Depth Score: ${report.overallDepthScore}/100`);

// Iterate dimensions
report.dimensions.forEach(dim => {
  console.log(`${dim.name}: ${dim.riskLevel} risk`);
});

// Check insights
report.keyInsights.forEach(insight => {
  console.log(insight);
});
```

### cURL
```bash
curl -X GET "http://localhost:5000/company/company-123/report" \
  -H "Content-Type: application/json"
```

### Python
```python
import requests

response = requests.get('http://localhost:5000/company/company-123/report')
report = response.json()

print(f"Completion Rate: {report['overallCompletionRate']}%")
print(f"Depth Score: {report['overallDepthScore']}/100")

for dim in report['dimensions']:
    print(f"{dim['name']}: {dim['riskLevel']} risk")
```

## Error Handling

### 404 Not Found
```json
{
  "error": "Company not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to generate report"
}
```

## Performance

- **Response Time**: < 100ms for typical company (3 projects, 50 sessions)
- **Data Freshness**: Real-time (calculated on request)
- **Caching**: Recommended to cache for 1 hour

## Rate Limiting

- No rate limiting currently implemented
- Recommended: 100 requests per minute per company

## Versioning

- Current API Version: 1.0
- Backward Compatibility: Maintained
