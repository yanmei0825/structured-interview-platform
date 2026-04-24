# Quick Start Guide - Company Analytics

## 5-Minute Setup

### 1. Start Backend
```bash
cd backend
npm install
npm start
```
Server runs on `http://localhost:5000`

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:3000`

### 3. Create Company
```bash
curl -X POST http://localhost:5000/company \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'
```

### 4. Create Project
```bash
curl -X POST http://localhost:5000/company/{companyId}/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Team",
    "demographicsEnabled": true,
    "allowedLanguages": ["en", "ru", "tr"]
  }'
```

### 5. Start Interview
Navigate to: `http://localhost:3000/interview-face-to-face?projectId={projectId}`

### 6. View Company Report
Navigate to: `http://localhost:3000/company-report?companyId={companyId}`

---

## Key Endpoints

### Get Company Report
```bash
GET /company/{companyId}/report
```

### Get Project Report
```bash
GET /company/{companyId}/projects/{projectId}/report
```

### Get Individual Report
```bash
GET /survey/{token}/report
```

---

## Understanding the Report

### Key Metrics
- **Completion Rate**: % of started interviews completed
- **Depth Score**: Quality of responses (0-100)
- **Coverage**: % of respondents per dimension
- **Risk Level**: low/medium/high

### Insights
- 🟢 **Green**: Good, maintain current practices
- 🟡 **Yellow**: Monitor, plan improvements
- 🔴 **Red**: Critical, immediate action needed

### Dimensions (D1-D10)
1. **Success** - Pride and achievement
2. **Security/Value** - Stability and recognition
3. **Relationships** - Team and manager dynamics
4. **Autonomy** - Control and freedom
5. **Engagement** - Energy and motivation
6. **Recognition** - Feedback and acknowledgment
7. **Learning** - Growth and development
8. **Purpose** - Meaning and impact
9. **Obstacles** - Blockers and frustrations
10. **Voice** - Being heard and influence

---

## Common Tasks

### View Company Dashboard
```
1. Go to /company-report?companyId={id}
2. See all metrics at a glance
3. Identify high-risk areas
4. Review project performance
```

### Export Report
```
1. Open company report
2. Click "Print Report"
3. Save as PDF
```

### Compare Projects
```
1. Open company report
2. Scroll to "Project Breakdown"
3. Compare completion rates and depth scores
```

### Identify Issues
```
1. Look for HIGH risk dimensions (red)
2. Check negative sentiment indicators
3. Review key insights
4. Take action on recommendations
```

---

## Troubleshooting

### Report Not Loading
- Check company ID is correct
- Verify backend is running
- Check browser console for errors

### No Data in Report
- Ensure interviews are completed
- Check project has sessions
- Verify sessions are marked as finished

### Metrics Look Wrong
- Refresh page
- Check backend logs
- Verify data in database

---

## API Quick Reference

### Create Session
```bash
POST /survey/public-session
Body: {"projectId": "..."}
```

### Send Message
```bash
POST /survey/{token}/message
Body: {"message": "..."}
```

### Get Report
```bash
GET /survey/{token}/report
```

### Get Company Report
```bash
GET /company/{companyId}/report
```

---

## Metrics Interpretation

### Coverage > 80%
✅ Well covered, good data

### Coverage 50-80%
⚠️ Adequate, consider more interviews

### Coverage < 50%
❌ Under-covered, need more data

### Depth > 70
✅ Strong data quality

### Depth 50-70
⚠️ Moderate quality

### Depth < 50
❌ Weak quality, extend interviews

---

## Risk Assessment

### Low Risk (Green)
- Coverage > 70%
- Positive sentiment
- Depth > 60
- **Action**: Maintain

### Medium Risk (Yellow)
- Coverage 50-70%
- Mixed sentiment
- Depth 40-60
- **Action**: Monitor

### High Risk (Red)
- Coverage < 50%
- Negative sentiment
- Depth < 40
- **Action**: Investigate

---

## Insights Guide

### "Strong areas: X, Y"
✅ These dimensions are well-covered and positive
- Maintain current practices
- Document best practices
- Share with team

### "High-risk areas: X"
⚠️ These dimensions need attention
- Investigate root causes
- Plan interventions
- Track improvements

### "Coverage gaps in: X"
📊 Need more data
- Conduct additional interviews
- Focus on this dimension
- Increase sample size

### "Negative sentiment in N dimensions"
😟 Widespread issues detected
- Launch engagement initiative
- Address systemic problems
- Improve work environment

### "Overall depth score is strong"
✅ Data quality is good
- Proceed with confidence
- Use for decision-making
- Share with stakeholders

---

## Best Practices

### Conducting Interviews
- Allow 20-30 minutes per interview
- Ensure quiet environment
- Use voice when possible
- Be specific with examples

### Analyzing Reports
- Review all 10 dimensions
- Look for patterns
- Check sentiment trends
- Prioritize high-risk areas

### Taking Action
- Address high-risk dimensions first
- Implement changes
- Track improvements
- Re-interview to measure impact

### Sharing Results
- Print reports for documentation
- Share key insights with team
- Discuss findings in meetings
- Create action plans

---

## Support

### Documentation
- See `COMPANY_ANALYTICS_COMPLETE.md` for details
- See `COMPANY_ANALYTICS_API.md` for API reference
- See `COMPANY_ANALYTICS_VISUAL_GUIDE.md` for visuals

### Issues
- Check backend logs
- Verify environment variables
- Check API connectivity
- Review error messages

### Questions
- Review documentation
- Check API reference
- Test with curl
- Debug in browser console

---

## Next Steps

1. ✅ Create company
2. ✅ Create project
3. ✅ Conduct interviews
4. ✅ View individual reports
5. ✅ View company report
6. ✅ Identify issues
7. ✅ Take action
8. ✅ Re-interview to measure impact

---

**Ready to get started?** 🚀

Start with: `http://localhost:3000`
