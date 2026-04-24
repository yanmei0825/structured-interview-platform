# Company Analytics - Visual Guide

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPANY REPORT                             │
│                   Generated: Jan 15, 2024                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────┐ │
│  │   Projects   │  │ Respondents  │  │ Completion   │  │Depth │ │
│  │      3       │  │      45      │  │     93%      │  │ 72/100
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                        KEY INSIGHTS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✓ Strong areas: Success, Relationships                          │
│  ⚠️ High-risk areas: Obstacles                                   │
│  📊 Coverage gaps in: Learning                                   │
│  ✓ Overall depth score is strong (72/100)                        │
│  ⚠️ Negative sentiment in 2 dimensions                           │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                    DIMENSION ANALYSIS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ D1: Success      [LOW]  │  │ D2: Security   [MED]    │       │
│  │ Coverage: 95% ████████  │  │ Coverage: 88% ███████   │       │
│  │ Depth: 78/100 ████████  │  │ Depth: 65/100 ██████    │       │
│  │ Signals: achievement    │  │ Signals: stable, valued │       │
│  │ Sentiment: 😊 Positive  │  │ Sentiment: 😐 Neutral   │       │
│  └─────────────────────────┘  └─────────────────────────┘       │
│                                                                   │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ D3: Relationships [LOW] │  │ D4: Autonomy   [HIGH]   │       │
│  │ Coverage: 92% ████████  │  │ Coverage: 45% ████      │       │
│  │ Depth: 75/100 ████████  │  │ Depth: 38/100 ███       │       │
│  │ Signals: trust, support │  │ Signals: control, free  │       │
│  │ Sentiment: 😊 Positive  │  │ Sentiment: 😟 Negative  │       │
│  └─────────────────────────┘  └─────────────────────────┘       │
│                                                                   │
│  ... (D5-D10 similar layout)                                     │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                    PROJECT BREAKDOWN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Project Name          Sessions  Completion  Depth               │
│  ─────────────────────────────────────────────────────           │
│  Engineering Team         15       100%      75/100              │
│  Sales Team               15        93%      70/100              │
│  Support Team             15        87%      72/100              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Dimension Card Details

### Low Risk (Green)
```
┌─────────────────────────────────┐
│ D1: Success              [LOW]   │
├─────────────────────────────────┤
│ Coverage: 95% ████████████████  │
│ Depth: 78/100 ████████████████  │
│ Respondents: 45                 │
│ Top Signals:                    │
│   • achievement (12)            │
│   • pride (10)                  │
│   • success (8)                 │
│   • delivered (7)               │
│   • accomplished (6)            │
│ Sentiment: 😊 Positive          │
└─────────────────────────────────┘
```

### Medium Risk (Yellow)
```
┌─────────────────────────────────┐
│ D2: Security/Value      [MED]    │
├─────────────────────────────────┤
│ Coverage: 70% ███████████        │
│ Depth: 55/100 ███████████        │
│ Respondents: 45                 │
│ Top Signals:                    │
│   • stable (8)                  │
│   • valued (7)                  │
│   • fair (6)                    │
│   • secure (5)                  │
│   • recognized (4)              │
│ Sentiment: 😐 Neutral           │
└─────────────────────────────────┘
```

### High Risk (Red)
```
┌─────────────────────────────────┐
│ D9: Obstacles           [HIGH]   │
├─────────────────────────────────┤
│ Coverage: 45% ████               │
│ Depth: 38/100 ███                │
│ Respondents: 45                 │
│ Top Signals:                    │
│   • workload (9)                │
│   • process (7)                 │
│   • frustrated (6)              │
│   • slow (5)                    │
│   • broken (4)                  │
│ Sentiment: 😟 Negative          │
└─────────────────────────────────┘
```

## Metrics Visualization

### Coverage Spectrum
```
0%          25%         50%         75%        100%
├───────────┼───────────┼───────────┼───────────┤
  CRITICAL    POOR      FAIR       GOOD      EXCELLENT
  
  < 50%      50-60%    60-75%     75-85%     > 85%
  ⚠️ HIGH    ⚠️ MED    ⚠️ MED     ✓ LOW      ✓ LOW
```

### Depth Score Spectrum
```
0          20         40         60         80        100
├──────────┼──────────┼──────────┼──────────┼──────────┤
  WEAK      POOR      FAIR      GOOD      STRONG    EXCELLENT
  
  < 30      30-50     50-70     70-85     > 85
  ⚠️ HIGH   ⚠️ MED    ⚠️ MED    ✓ LOW     ✓ LOW
```

### Risk Level Matrix

```
                    Coverage
              Low      Medium     High
         ┌─────────┬─────────┬─────────┐
    Pos  │  LOW    │  LOW    │  LOW    │
Sent     ├─────────┼─────────┼─────────┤
    Neu  │  MED    │  LOW    │  LOW    │
         ├─────────┼─────────┼─────────┤
    Neg  │  HIGH   │  MED    │  MED    │
         └─────────┴─────────┴─────────┘
```

## Insight Generation Flow

```
                    ┌─────────────────┐
                    │  Analyze Data   │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ Coverage │  │ Sentiment│  │  Depth   │
         │ Analysis │  │ Analysis │  │ Analysis │
         └────┬─────┘  └────┬─────┘  └────┬─────┘
              │             │             │
              └─────────────┼─────────────┘
                            │
                    ┌───────▼────────┐
                    │ Generate Rules │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌────────┐          ┌────────┐         ┌────────┐
    │ Alerts │          │ Praise │         │ Advice │
    └────────┘          └────────┘         └────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Top 5 Insights│
                    └────────────────┘
```

## Data Aggregation Example

### Individual Sessions
```
Session 1 (Engineering)
├─ D1: 4 turns, 3 signals → Depth: 75
├─ D2: 3 turns, 2 signals → Depth: 60
└─ D3: 5 turns, 4 signals → Depth: 85

Session 2 (Engineering)
├─ D1: 5 turns, 4 signals → Depth: 85
├─ D2: 2 turns, 1 signal  → Depth: 40
└─ D3: 4 turns, 3 signals → Depth: 75

Session 3 (Sales)
├─ D1: 3 turns, 2 signals → Depth: 60
├─ D2: 4 turns, 3 signals → Depth: 75
└─ D3: 3 turns, 2 signals → Depth: 60
```

### Project Aggregation
```
Engineering Project
├─ D1: Avg Depth = (75 + 85) / 2 = 80
├─ D2: Avg Depth = (60 + 40) / 2 = 50
└─ D3: Avg Depth = (85 + 75) / 2 = 80

Sales Project
├─ D1: Avg Depth = 60
├─ D2: Avg Depth = 75
└─ D3: Avg Depth = 60
```

### Company Aggregation
```
Company Overall
├─ D1: Avg Depth = (80 + 60) / 2 = 70
├─ D2: Avg Depth = (50 + 75) / 2 = 62.5
└─ D3: Avg Depth = (80 + 60) / 2 = 70

Overall Depth Score = (70 + 62.5 + 70) / 3 = 67.5
```

## Sentiment Tracking

### Per Dimension
```
D1 (Success)
├─ Positive Events: 12
├─ Negative Events: 2
├─ Neutral Events: 1
└─ Trend: POSITIVE ✓

D2 (Security)
├─ Positive Events: 5
├─ Negative Events: 8
├─ Neutral Events: 2
└─ Trend: NEGATIVE ⚠️

D3 (Relationships)
├─ Positive Events: 10
├─ Negative Events: 3
├─ Neutral Events: 2
└─ Trend: POSITIVE ✓
```

### Company Sentiment Summary
```
Positive Dimensions: 7 ✓
Negative Dimensions: 2 ⚠️
Neutral Dimensions: 1 😐

Overall Sentiment: POSITIVE ✓
```

## Report Generation Timeline

```
Request Received
    │
    ▼
Load All Projects
    │
    ▼
For Each Project:
├─ Load All Sessions
├─ Calculate Metrics
└─ Aggregate Data
    │
    ▼
Aggregate Across Projects
    │
    ▼
Calculate Risk Levels
    │
    ▼
Generate Insights
    │
    ▼
Format Response
    │
    ▼
Return Report (~100ms)
```

## Color Coding System

### Risk Levels
- 🟢 **LOW** (Green): #10b981 - No action needed
- 🟡 **MEDIUM** (Yellow): #f59e0b - Monitor and plan
- 🔴 **HIGH** (Red): #ef4444 - Immediate action needed

### Sentiment
- 😊 **POSITIVE** (Green): Favorable responses
- 😐 **NEUTRAL** (Gray): Mixed responses
- 😟 **NEGATIVE** (Red): Unfavorable responses

### Status
- ✓ **Good** (Green): Target achieved
- ⚠️ **Warning** (Yellow): Attention needed
- ❌ **Critical** (Red): Action required
- 📊 **Info** (Blue): Informational

## Print Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   COMPANY REPORT                        │
│                                                         │
│                  Acme Corporation                       │
│              Generated: January 15, 2024                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Key Metrics:                                           │
│  • Total Projects: 3                                    │
│  • Total Respondents: 45                                │
│  • Completion Rate: 93%                                 │
│  • Overall Depth Score: 72/100                          │
│                                                         │
│  Key Insights:                                          │
│  1. Strong areas: Success, Relationships                │
│  2. High-risk areas: Obstacles                          │
│  3. Coverage gaps in: Learning                          │
│  4. Overall data quality is good                        │
│  5. Negative sentiment in 2 dimensions                  │
│                                                         │
│  [Dimension Analysis Grid - 2 columns]                  │
│  [Project Breakdown Table]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
