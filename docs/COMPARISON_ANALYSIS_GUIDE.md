# Multi-Interview Comparison Analysis - Quick Guide

## What It Does

Compares responses from multiple team members to identify:
- ✅ Consistent strengths (areas where everyone excels)
- ⚠️ Consistent weaknesses (areas where everyone struggles)
- 📊 High variance dimensions (where experiences differ)
- 😊 Overall sentiment patterns

## Quick Start

### Access Comparison Analysis
```
http://localhost:3000/comparison?companyId={id}&projectId={projectId}
```

### API Endpoint
```bash
GET /company/{companyId}/projects/{projectId}/comparison
```

## Key Metrics

### Aggregated Metrics
- **Avg Turns**: Average conversation turns per interview
- **Avg Depth Score**: Average quality of responses (0-100)
- **Avg Questions**: Average questions per interview

### Dimension Metrics
- **Avg Depth**: Average score for dimension
- **Min/Max**: Range of scores
- **Variance**: Consistency (< 20 = consistent, > 40 = high variation)
- **Sentiment**: Distribution of positive/negative/neutral

## Interpreting Results

### Consistent Strengths
```
✓ Success, Relationships
```
- These dimensions are strong across the team
- Maintain current practices
- Document and share best practices

### Consistent Weaknesses
```
⚠️ Obstacles, Learning
```
- These dimensions are weak across the team
- Investigate root causes
- Implement improvements
- Track progress

### High Variance Dimensions
```
📊 Autonomy (Variance: 45)
```
- Responses vary significantly
- Some team members have different experiences
- Investigate fairness
- Standardize if needed

### Sentiment Patterns
```
😊 Predominantly Positive
😟 Predominantly Negative
😐 Balanced
```

## Dashboard Sections

### 1. Patterns & Insights
- Consistent strengths
- Consistent weaknesses
- High variance dimensions
- Overall sentiment

### 2. Dimension Comparison
- Depth score range (min-max)
- Average metrics
- Sentiment distribution
- Top signals

### 3. Respondent Profiles
- Individual scores
- Strong dimensions
- Weak dimensions
- Demographics

## Analysis Examples

### Example 1: Consistent Strength
```
D1: Success
├─ Avg Depth: 78/100
├─ Min: 65, Max: 90
├─ Variance: 25 (Moderate)
└─ Sentiment: 12 positive, 2 negative
```
**Interpretation**: Team generally feels successful, with consistent achievement.

### Example 2: Consistent Weakness
```
D9: Obstacles
├─ Avg Depth: 35/100
├─ Min: 20, Max: 50
├─ Variance: 30 (Moderate)
└─ Sentiment: 2 positive, 12 negative
```
**Interpretation**: Team faces significant obstacles, needs intervention.

### Example 3: High Variance
```
D4: Autonomy
├─ Avg Depth: 55/100
├─ Min: 30, Max: 85
├─ Variance: 55 (High)
└─ Sentiment: 6 positive, 4 negative, 5 neutral
```
**Interpretation**: Some team members have autonomy, others don't. Investigate fairness.

## Variance Interpretation

### Low Variance (< 20)
- ✅ Consistent team experience
- Everyone has similar perspective
- Indicates fairness or universal issue

### Medium Variance (20-40)
- ⚠️ Some variation in experience
- Different perspectives exist
- May indicate individual differences

### High Variance (> 40)
- 🔴 Significant variation
- Major differences in experience
- Investigate root causes
- May indicate fairness issues

## Use Cases

### Team Health Check
1. View comparison analysis
2. Check for consistent weaknesses
3. Identify improvement areas
4. Track progress over time

### Fairness Assessment
1. Look for high variance dimensions
2. Investigate why experiences differ
3. Ensure equitable treatment
4. Standardize processes

### Performance Benchmarking
1. Identify strong dimensions
2. Document best practices
3. Share with other teams
4. Measure improvement

### Onboarding Evaluation
1. Compare new vs. experienced employees
2. Identify onboarding gaps
3. Improve new hire experience
4. Reduce time-to-productivity

## Respondent Profiles

### What It Shows
- Individual respondent scores
- Strong dimensions (depth >= 70)
- Weak dimensions (depth < 50)
- Demographics

### How to Use
1. Click on respondent to expand
2. View their strong/weak areas
3. Provide targeted support
4. Track individual progress

## Patterns Explained

### Consistent Strengths
- Dimensions where 70%+ scored >= 70
- Universal strength areas
- Action: Maintain and leverage

### Consistent Weaknesses
- Dimensions where 50%+ scored < 50
- Universal problem areas
- Action: Investigate and address

### High Variance Dimensions
- Variance >= 40
- Inconsistent experiences
- Action: Investigate variation

### Sentiment Patterns
- Overall team sentiment
- Predominantly positive/negative/neutral
- Action: Respond accordingly

## Actionable Insights

### If Consistent Strength Found
```
✓ Success is strong across team
→ Document what's working
→ Share best practices
→ Maintain current approach
```

### If Consistent Weakness Found
```
⚠️ Obstacles are weak across team
→ Investigate root causes
→ Implement improvements
→ Track progress
→ Re-interview to measure impact
```

### If High Variance Found
```
📊 Autonomy varies significantly
→ Investigate why experiences differ
→ Check for fairness issues
→ Standardize processes
→ Provide targeted support
```

### If Negative Sentiment
```
😟 Predominantly negative sentiment
→ Conduct follow-up interviews
→ Address specific concerns
→ Implement improvements
→ Track sentiment change
```

## Comparison vs. Company Report

### Comparison Analysis
- Focuses on single project
- Compares multiple respondents
- Shows variation and patterns
- Identifies individual differences

### Company Report
- Aggregates all projects
- Shows company-wide metrics
- Identifies company-level trends
- Compares projects

## Tips & Best Practices

1. **Regular Reviews**
   - Review comparison quarterly
   - Track changes over time
   - Measure improvement initiatives

2. **Follow-up Actions**
   - Address consistent weaknesses
   - Investigate high variance
   - Share best practices

3. **Team Discussions**
   - Share results with team
   - Discuss findings
   - Develop action plans
   - Track progress

4. **Benchmarking**
   - Compare across projects
   - Identify best practices
   - Share learnings
   - Improve overall performance

## Troubleshooting

### No Data Showing
- Ensure interviews are completed
- Check project has sessions
- Verify sessions are marked finished

### Metrics Look Wrong
- Refresh page
- Check backend logs
- Verify data integrity

### High Variance Everywhere
- May indicate diverse team
- Investigate individual circumstances
- Provide targeted support

## Export & Print

### Print Report
1. Click "Print Analysis"
2. Select printer
3. Save as PDF

### Share Results
1. Print to PDF
2. Email to stakeholders
3. Discuss in meetings
4. Create action plans

## Next Steps

1. **Review Results**
   - Understand patterns
   - Identify key issues
   - Prioritize actions

2. **Take Action**
   - Address weaknesses
   - Investigate variance
   - Share best practices

3. **Track Progress**
   - Re-interview team
   - Measure improvements
   - Adjust strategies

4. **Continuous Improvement**
   - Regular reviews
   - Ongoing monitoring
   - Iterative improvements

---

**For detailed information, see `MULTI_INTERVIEW_COMPARISON_COMPLETE.md`**
