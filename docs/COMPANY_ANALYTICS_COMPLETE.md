# Company-Level Data Aggregation & Analysis - Implementation Complete

## Overview
Implemented comprehensive company-level analytics that aggregates interview data across all projects and provides actionable insights for organizational decision-making.

## Architecture

### Data Flow
```
Individual Interviews (Sessions)
    ↓
Project-Level Reports (generateProjectReport)
    ↓
Company-Level Aggregation (generateCompanyReport)
    ↓
Insights & Risk Assessment
    ↓
Frontend Visualization
```

## Backend Implementation

### New Analytics Functions (`backend/src/analytics.ts`)

#### 1. Company Report Generation
```typescript
generateCompanyReport(companyId: string): CompanyReport
```

**Aggregates:**
- All projects under the company
- All sessions across all projects
- All dimensions across all respondents
- Sentiment trends and signals

**Returns:**
```typescript
interface CompanyReport {
  companyId: string;
  companyName: string;
  totalProjects: number;
  totalSessions: number;
  finishedSessions: number;
  overallCompletionRate: number;      // 0-100%
  overallDepthScore: number;          // 0-100
  dimensions: CompanyDimensionAnalysis[];
  projectBreakdown: ProjectBreakdown[];
  keyInsights: string[];
  generatedAt: number;
}
```

#### 2. Dimension Analysis
Each dimension includes:
- **avgCoveragePercent**: Average coverage across all projects (0-100%)
- **avgDepthScore**: Average depth score (0-100)
- **totalRespondents**: Total respondents across all projects
- **topSignals**: Top 5 signals/keywords across all respondents
- **sentimentTrend**: Overall sentiment (positive/negative/neutral)
- **riskLevel**: Risk assessment (low/medium/high)

#### 3. Risk Assessment Logic
```
Risk Level Calculation:
- HIGH: Coverage < 50% OR (Negative sentiment AND Depth < 40)
- MEDIUM: Coverage < 70% OR (Negative sentiment AND Depth < 60)
- LOW: All other cases
```

#### 4. Key Insights Generation
Automatically generates up to 5 actionable insights:
- High-risk dimensions requiring attention
- Strong dimensions to maintain
- Sentiment analysis across dimensions
- Coverage gaps
- Project performance issues
- Overall data quality assessment

### New API Endpoint

**GET `/company/:id/report`**
- Returns aggregated company-level analysis
- Includes all dimensions, projects, and insights
- Real-time calculation based on current data

## Frontend Implementation

### Company Report Page (`frontend/app/company-report/page.tsx`)
- Fetches report using company ID from query parameter
- Displays loading/error states
- Renders comprehensive report visualization

### Company Report Display Component (`frontend/components/CompanyReportDisplay.tsx`)

**Features:**
1. **Header Section**
   - Company name and generation date
   - Key metrics: Projects, Respondents, Completion Rate, Depth Score

2. **Key Insights**
   - Actionable recommendations
   - Risk alerts
   - Performance highlights

3. **Dimension Analysis Grid**
   - 2-column responsive layout
   - Color-coded by risk level (green/yellow/red)
   - Coverage and depth progress bars
   - Top signals display
   - Sentiment indicators (emoji)

4. **Project Breakdown Table**
   - All projects listed with metrics
   - Sessions count
   - Completion rate with color coding
   - Depth score with color coding
   - Sortable and responsive

5. **Print Functionality**
   - Print-friendly styling
   - Dark theme with good contrast
   - All data visible in print

## Data Aggregation Details

### Coverage Calculation
```
Coverage % = (Respondents who covered dimension / Total respondents) × 100
```

### Depth Score Calculation
```
Depth Score = (Turn Coverage × 50) + (Signal Density × 50)
- Turn Coverage = (Turns / Max Turns) × 50
- Signal Density = (min(Signals, 5) / 5) × 50
```

### Sentiment Aggregation
- Counts positive/negative/neutral events per dimension
- Determines trend based on highest count
- Used for risk assessment

### Signal Aggregation
- Collects all signals from all respondents
- Ranks by frequency
- Top 5 signals displayed per dimension

## Usage

### For Administrators
1. Navigate to company report: `/company-report?companyId={companyId}`
2. View aggregated metrics across all projects
3. Identify high-risk areas
4. Review project performance
5. Print report for documentation

### For Developers
```typescript
// Fetch company report
GET /company/{companyId}/report

// Response includes:
{
  companyId: "...",
  totalProjects: 3,
  totalSessions: 45,
  finishedSessions: 42,
  overallCompletionRate: 93,
  overallDepthScore: 72,
  dimensions: [
    {
      key: "D1",
      name: "Success",
      avgCoveragePercent: 95,
      avgDepthScore: 78,
      totalRespondents: 45,
      topSignals: ["achievement", "pride", "success"],
      sentimentTrend: "positive",
      riskLevel: "low"
    },
    // ... more dimensions
  ],
  projectBreakdown: [
    {
      projectId: "...",
      projectName: "Project A",
      sessions: 15,
      completionRate: 100,
      depthScore: 75
    },
    // ... more projects
  ],
  keyInsights: [
    "✓ Strong areas: Success, Relationships",
    "⚠️ Coverage gaps in: Learning",
    // ... more insights
  ]
}
```

## Key Metrics Explained

### Overall Completion Rate
- Percentage of started interviews that were completed
- Target: > 80%
- Indicates interview process effectiveness

### Overall Depth Score
- Average depth across all dimensions and respondents
- Range: 0-100
- Target: > 70%
- Indicates data quality and interview thoroughness

### Coverage Percent (per dimension)
- Percentage of respondents who covered this dimension
- Target: > 80%
- Low coverage indicates need for more interviews

### Depth Score (per dimension)
- Quality of responses for this dimension
- Range: 0-100
- Combines turn count and signal density

### Risk Level
- Assessment of dimension health
- LOW: Good coverage, positive sentiment
- MEDIUM: Moderate coverage or mixed sentiment
- HIGH: Low coverage or negative sentiment

## Insights Examples

### High-Risk Alert
```
⚠️ High-risk areas: Obstacles, Voice. Recommend immediate attention.
```
Indicates dimensions with low coverage or negative sentiment requiring action.

### Strong Areas
```
✓ Strong areas: Success, Relationships. Maintain current practices.
```
Highlights well-covered dimensions with positive sentiment.

### Sentiment Warning
```
⚠️ Negative sentiment detected in 4 dimensions. Consider employee engagement initiatives.
```
Indicates widespread negative feedback requiring organizational response.

### Coverage Gap
```
📊 Coverage gaps in: Learning. Recommend additional interviews.
```
Suggests need for more data collection in specific areas.

### Project Performance
```
📉 2 project(s) have low completion rates. Review interview process.
```
Identifies projects needing process improvement.

## Files Modified/Created

### Backend
- `backend/src/analytics.ts` - Added company-level analytics functions
- `backend/src/routes/company.ts` - Added company report endpoint

### Frontend
- `frontend/app/company-report/page.tsx` - New company report page (created)
- `frontend/components/CompanyReportDisplay.tsx` - New report display component (created)

## Integration Points

### With Existing Systems
- Uses existing `generateProjectReport()` for project data
- Leverages session data from `getAllSessionsByProject()`
- Integrates with dimension definitions from `getDimension()`
- Uses event logs for sentiment analysis

### Data Dependencies
- Project data from store
- Session data from session manager
- Event logs for sentiment tracking
- Dimension definitions for context

## Performance Considerations

### Calculation Complexity
- O(P × S × D) where P = projects, S = sessions, D = dimensions
- Typical: 3 projects × 50 sessions × 10 dimensions = 1,500 operations
- Execution time: < 100ms for typical company

### Caching Recommendations
- Cache company reports for 1 hour
- Invalidate on new session completion
- Regenerate on-demand for real-time data

## Future Enhancements

1. **Trend Analysis**
   - Track metrics over time
   - Identify improving/declining dimensions
   - Predict future trends

2. **Comparative Analysis**
   - Compare across projects
   - Benchmark against industry standards
   - Identify best practices

3. **Export Formats**
   - PDF export with branding
   - Excel export for analysis
   - JSON export for integration

4. **Advanced Filtering**
   - Filter by department
   - Filter by date range
   - Filter by respondent demographics

5. **Predictive Analytics**
   - Identify at-risk employees
   - Predict turnover risk
   - Recommend interventions

6. **Real-time Dashboard**
   - Live metrics updates
   - Streaming data visualization
   - Alert notifications

## Testing Recommendations

1. **Data Accuracy**
   - Verify aggregation calculations
   - Test with various project/session counts
   - Validate sentiment calculations

2. **Edge Cases**
   - Empty projects
   - Single respondent
   - All negative sentiment
   - All positive sentiment

3. **Performance**
   - Load test with large datasets
   - Measure response times
   - Optimize slow queries

4. **UI/UX**
   - Test responsive design
   - Verify print output
   - Check accessibility

## Security Considerations

- Company reports contain aggregated data only
- No individual respondent data exposed
- Maintain company access control
- Audit report access
- Encrypt sensitive metrics in transit
