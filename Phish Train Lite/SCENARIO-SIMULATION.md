# Phish Train Lite - Simulation Scenarios Guide

This document provides comprehensive testing scenarios for the simulation engine. Use these scenarios to test campaign effectiveness, validate system behavior, and train administrators.

> **Quick Start**: Go to Analytics tab → Select campaign → Adjust sliders → Run Simulation

---

## Table of Contents

1. [Employee Awareness Level Scenarios](#1-employee-awareness-level-scenarios)
2. [Department-Specific Scenarios](#2-department-specific-scenarios)
3. [Attack Sophistication Scenarios](#3-attack-sophistication-scenarios)
4. [Training Effectiveness Scenarios](#4-training-effectiveness-scenarios)
5. [Edge Cases & Stress Tests](#5-edge-cases--stress-tests)
6. [Comparative Analysis Scenarios](#6-comparative-analysis-scenarios)
7. [Seasonal & Contextual Scenarios](#7-seasonal--contextual-scenarios)
8. [Progressive Training Scenarios](#8-progressive-training-scenarios)
9. [Compliance & Reporting Scenarios](#9-compliance--reporting-scenarios)
10. [Real-World Industry Benchmarks](#10-real-world-industry-benchmarks)
11. [How to Test These Scenarios](#how-to-test-these-scenarios)
12. [Recommended Testing Sequence](#recommended-testing-sequence)

---

## 1. Employee Awareness Level Scenarios

### Scenario A: Untrained Organization (High Risk)
**Configuration:**
- Open Rate: 75-85%
- Click Rate: 50-70%
- Submit Rate: 30-50%

**Use Case:** Baseline assessment before any security awareness training

**Expected Outcome:**
- Manager notification triggered (exceeds 50% threshold)
- High vulnerability revealed across organization
- Demonstrates urgent need for training

**Testing Steps:**
1. Create campaign targeting all employees
2. Set rates: 80% open, 60% click, 40% submit
3. Run simulation
4. Verify manager notification sent
5. Export results for baseline report

---

### Scenario B: Average Awareness (Moderate Risk)
**Configuration:**
- Open Rate: 55-65%
- Click Rate: 25-35%
- Submit Rate: 8-15%

**Use Case:** Organization with basic security training in place

**Expected Outcome:**
- Some employees fall for phishing attempts
- Moderate risk level
- Room for improvement identified

**Testing Steps:**
1. Use same campaign as Scenario A
2. Clear previous simulation data
3. Set rates: 60% open, 30% click, 10% submit
4. Run simulation
5. Compare to Scenario A baseline

---

### Scenario C: Well-Trained Organization (Low Risk)
**Configuration:**
- Open Rate: 30-40%
- Click Rate: 10-18%
- Submit Rate: 2-5%

**Use Case:** After comprehensive phishing awareness training

**Expected Outcome:**
- Good security posture demonstrated
- Minimal risk exposure
- Training investment paying off

**Testing Steps:**
1. Set rates: 35% open, 15% click, 4% submit
2. Run simulation
3. Manager notification should NOT trigger
4. Document improvement from baseline

---

### Scenario D: Security-Conscious Culture (Very Low Risk)
**Configuration:**
- Open Rate: 15-25%
- Click Rate: 5-10%
- Submit Rate: 0-2%

**Use Case:** Security-focused organizations (financial, defense, healthcare)

**Expected Outcome:**
- Excellent security awareness
- Minimal vulnerabilities
- Best-in-class performance

**Testing Steps:**
1. Set rates: 20% open, 8% click, 1% submit
2. Run simulation
3. Verify system handles low event volumes
4. Use for aspirational benchmarking

---

## 2. Department-Specific Scenarios

### Scenario E: IT/Security Department
**Configuration:**
- Open Rate: 20%
- Click Rate: 8%
- Submit Rate: 1%

**Target Departments:**
- Cybersecurity
- IT Operations
- DevOps

**Rationale:** Technical teams should demonstrate lower vulnerability due to security expertise

**Testing Steps:**
1. Create campaign targeting IT departments
2. Set conservative rates
3. Run simulation
4. Compare to organization average
5. Investigate if rates are higher than expected

---

### Scenario F: Finance/Executive Department
**Configuration:**
- Open Rate: 45%
- Click Rate: 22%
- Submit Rate: 12%

**Target Departments:**
- Finance
- CEO/Executive
- Legal

**Rationale:** High-value targets frequently targeted by sophisticated attacks (BEC, wire fraud)

**Testing Steps:**
1. Create campaign for Finance/Executive
2. Simulate targeted attack scenario
3. Assess risk to high-value accounts
4. Plan additional training if needed

---

### Scenario G: Sales/Marketing Department
**Configuration:**
- Open Rate: 70%
- Click Rate: 40%
- Submit Rate: 18%

**Target Departments:**
- Sales
- Marketing
- Customer Support

**Rationale:** High external email interaction, frequent link clicking, elevated exposure

**Testing Steps:**
1. Target customer-facing departments
2. Use higher engagement rates
3. Identify need for role-specific training
4. Consider email filtering improvements

---

### Scenario H: HR Department
**Configuration:**
- Open Rate: 60%
- Click Rate: 35%
- Submit Rate: 20%

**Target Departments:**
- Human Resources

**Rationale:** Frequent unsolicited emails (resumes, applications), vulnerable to targeted attacks

**Testing Steps:**
1. Create HR-focused campaign
2. Simulate resume/application phishing
3. Assess vulnerability to social engineering
4. Recommend enhanced email screening

---

## 3. Attack Sophistication Scenarios

### Scenario I: Basic Phishing (Low Sophistication)
**Configuration:**
- Template: Package Delivery
- Open Rate: 50%
- Click Rate: 20%
- Submit Rate: 8%

**Attack Characteristics:**
- Generic mass phishing
- Low personalization
- Common delivery scam

**Use Case:** Test response to unsophisticated attacks

---

### Scenario J: Social Engineering (Medium Sophistication)
**Configuration:**
- Template: Updated Security Policy
- Open Rate: 65%
- Click Rate: 38%
- Submit Rate: 15%

**Attack Characteristics:**
- Urgency and authority
- Organizational context
- Moderate targeting

**Use Case:** Simulate realistic corporate phishing

---

### Scenario K: Spear Phishing (High Sophistication)
**Configuration:**
- Template: Login Verification Notice
- Open Rate: 80%
- Click Rate: 55%
- Submit Rate: 35%

**Attack Characteristics:**
- Highly personalized
- Credible source mimicry
- Targeted at specific individuals

**Use Case:** Test defenses against advanced threats

---

## 4. Training Effectiveness Scenarios

### Scenario L: Before Training (Baseline)
**Configuration:**
- Open Rate: 70%
- Click Rate: 45%
- Submit Rate: 25%

**Purpose:** Establish baseline vulnerability before training intervention

**Metrics to Track:**
- Total click count
- Departments with highest vulnerability
- Individual high-risk employees

---

### Scenario M: Immediately After Training
**Configuration:**
- Open Rate: 50% (-20% from baseline)
- Click Rate: 25% (-20% from baseline)
- Submit Rate: 10% (-15% from baseline)

**Purpose:** Measure immediate training impact

**Expected:** Significant reduction in all metrics, demonstrating training effectiveness

---

### Scenario N: 3 Months Post-Training
**Configuration:**
- Open Rate: 55% (slight regression)
- Click Rate: 28% (slight regression)
- Submit Rate: 12% (slight regression)

**Purpose:** Measure training retention over time

**Expected:** Slight regression but still better than baseline, indicates need for reinforcement

---

### Scenario O: 6 Months Post-Training
**Configuration:**
- Open Rate: 40% (continued improvement)
- Click Rate: 18% (continued improvement)
- Submit Rate: 6% (continued improvement)

**Purpose:** Long-term training effectiveness with reinforcement

**Expected:** Sustained improvement with ongoing training program

---

## 5. Edge Cases & Stress Tests

### Scenario P: Perfect Storm (Worst Case)
**Configuration:**
- Open Rate: 95%
- Click Rate: 85%
- Submit Rate: 70%

**Purpose:**
- Test system limits and performance
- Validate manager notification system
- Stress test database and analytics

**Expected Behavior:**
- System handles high event volume (10,000+ events)
- Multiple manager notifications
- Analytics calculations remain accurate
- Dashboard responsive

---

### Scenario Q: Security Champions (Best Case)
**Configuration:**
- Open Rate: 5%
- Click Rate: 2%
- Submit Rate: 0%

**Purpose:**
- Test lower bounds
- Validate analytics with minimal engagement
- Verify empty state handling

**Expected Behavior:**
- System handles near-zero events gracefully
- No manager notifications
- Dashboard displays correctly with minimal data

---

### Scenario R: Threshold Testing (Exactly 50%)
**Configuration:**
- Open Rate: 70%
- Click Rate: 50% ← **Exactly at threshold**
- Submit Rate: 20%

**Purpose:** Verify manager notification triggers at exactly 50%

**Testing Steps:**
1. Ensure campaign has manager_email set
2. Run simulation with 50% click rate
3. Verify notification sent
4. Check `notified_high_clicks = 1` in database

---

### Scenario S: Just Below Threshold
**Configuration:**
- Open Rate: 70%
- Click Rate: 49% ← **Just below threshold**
- Submit Rate: 20%

**Purpose:** Verify notification does NOT trigger below 50%

**Testing Steps:**
1. Clear previous simulation data
2. Run with 49% click rate
3. Verify NO notification sent
4. Confirm `notified_high_clicks = 0`

---

## 6. Comparative Analysis Scenarios

### Scenario T: Template Effectiveness Comparison
**Objective:** Determine which email template is most effective

**Method:**
1. Create 3 campaigns (one per template)
2. Target same department in each
3. Use identical simulation rates: 60% / 30% / 10%
4. Compare which would be most realistic

**Expected Patterns:**
- **Login Verification**: High engagement (urgent, security-focused)
- **Security Policy**: Moderate engagement (official, mandatory)
- **Package Delivery**: Highest engagement (common, non-threatening)

---

### Scenario U: Department Vulnerability Ranking
**Objective:** Identify which departments are most vulnerable

**Method:**
1. Create 17 campaigns (one per department)
2. Use consistent rates: 60% / 30% / 10%
3. Run simulation on each
4. Compare results in Dashboard

**Analysis:**
- Rank departments by click rate
- Identify high-risk departments
- Target training resources accordingly
- Compare to scenarios E-H predictions

---

## 7. Seasonal & Contextual Scenarios

### Scenario V: Holiday Season Phishing
**Configuration:**
- Open Rate: 80%
- Click Rate: 50%
- Submit Rate: 25%

**Context:** December holidays, increased package delivery expectations

**Rationale:**
- People expect deliveries
- Less cautious during busy season
- Shopping-related emails common

**Template:** Package Delivery

---

### Scenario W: Tax Season Attacks
**Configuration:**
- Open Rate: 65%
- Click Rate: 40%
- Submit Rate: 22%

**Context:** April tax deadline, IRS-themed phishing prevalent

**Rationale:**
- Financial urgency
- Fear of penalties
- Official-looking communications

**Template:** Login Verification (adapted for tax context)

---

### Scenario X: Remote Work Transition
**Configuration:**
- Open Rate: 70%
- Click Rate: 45%
- Submit Rate: 20%

**Context:** New IT policies during remote work shift

**Rationale:**
- Policy confusion
- New tools and systems
- Increased IT communications

**Template:** Updated Security Policy

---

## 8. Progressive Training Scenarios

### Scenario Y: 12-Month Training Program

**Month 1 - Baseline:**
- Rates: 70% / 40% / 20%
- Action: Establish baseline, identify high-risk employees

**Month 2 - After Awareness Video:**
- Rates: 65% / 35% / 15%
- Improvement: -5% / -5% / -5%
- Action: Lightweight awareness content

**Month 3 - After Hands-On Training:**
- Rates: 55% / 25% / 10%
- Improvement: -10% / -10% / -5%
- Action: Interactive workshops

**Month 4 - Reinforcement Campaign:**
- Rates: 50% / 22% / 8%
- Improvement: -5% / -3% / -2%
- Action: Follow-up reminders

**Month 6 - Long-Term Retention:**
- Rates: 45% / 18% / 6%
- Improvement: -5% / -4% / -2%
- Action: Ongoing reinforcement

**Month 12 - Annual Assessment:**
- Rates: 40% / 15% / 5%
- Total Improvement: -30% / -25% / -15%
- Action: Celebrate success, plan next year

**Testing Method:**
1. Run each month's simulation
2. Clear data between runs
3. Document results in spreadsheet
4. Track improvement trajectory
5. Report to leadership quarterly

---

## 9. Compliance & Reporting Scenarios

### Scenario Z: Regulatory Compliance Test
**Configuration:**
- Open Rate: 60%
- Click Rate: 30%
- Submit Rate: 10%

**Purpose:** Generate data for compliance reports

**Applicable Regulations:**
- GDPR (EU data protection)
- HIPAA (healthcare)
- SOC 2 (security controls)
- PCI DSS (payment card industry)
- NIST Cybersecurity Framework

**Deliverables:**
1. Run simulation quarterly
2. Export CSV of events
3. Document training completion rates
4. Report to auditors/regulators
5. Demonstrate due diligence

---

### Scenario AA: Executive Reporting
**Objective:** Present training ROI to leadership

**Method:**
1. Run monthly simulations (Scenario Y)
2. Compare trends over time
3. Calculate cost savings from prevented breaches
4. Present improvement metrics

**Sample Report Metrics:**
- **Baseline Risk**: 40% click rate × 10,000 employees = 4,000 potential victims
- **After Training**: 15% click rate × 10,000 employees = 1,500 potential victims
- **Risk Reduction**: 2,500 fewer potential victims (62.5% improvement)
- **Estimated Savings**: Avg breach cost $150/record × 2,500 = $375,000 prevented

---

## 10. Real-World Industry Benchmarks

### Financial Services
**Expected Performance:**
- Open Rate: 35%
- Click Rate: 15%
- Submit Rate: 5%

**Rationale:** High regulatory requirements, mandatory security training

**Your Test:**
1. Set rates to industry benchmark
2. Run simulation
3. Compare your actual campaign results
4. Identify if you're above/below standard

---

### Healthcare
**Expected Performance:**
- Open Rate: 45%
- Click Rate: 22%
- Submit Rate: 8%

**Rationale:** HIPAA training, patient data sensitivity

---

### Retail/E-Commerce
**Expected Performance:**
- Open Rate: 65%
- Click Rate: 35%
- Submit Rate: 15%

**Rationale:** High email volume, customer-facing roles, lower security focus

---

### Technology Companies
**Expected Performance:**
- Open Rate: 30%
- Click Rate: 12%
- Submit Rate: 4%

**Rationale:** Tech-savvy workforce, security-conscious culture

---

### Government/Defense
**Expected Performance:**
- Open Rate: 25%
- Click Rate: 10%
- Submit Rate: 3%

**Rationale:** Strict security protocols, mandatory training, clearance requirements

---

## How to Test These Scenarios

### Method 1: Quick Single Test
**Steps:**
1. Navigate to **Analytics** tab
2. Select campaign from dropdown
3. Adjust sliders to desired rates
4. Click **Run Simulation**
5. Wait for completion (2-10 seconds)
6. Review success message
7. Analyze updated analytics

**Best For:** Quick validation, single scenario testing

---

### Method 2: Comparative Testing
**Steps:**
1. Create multiple campaigns (same template, different departments)
2. Go to Analytics tab
3. For each campaign:
   - Select campaign
   - Run same simulation rates
   - Document results
4. Compare results in Dashboard tab
5. Export CSV for detailed analysis

**Best For:** Department comparisons, template effectiveness

---

### Method 3: Progressive Testing (Training Effectiveness)
**Steps:**
1. Select campaign
2. Run Scenario L (Before Training): 70% / 45% / 25%
3. Record results
4. Click **Clear Simulated Data**
5. Run Scenario M (After Training): 50% / 25% / 10%
6. Record results
7. Clear and repeat for Scenarios N, O
8. Compare all results in spreadsheet

**Best For:** Demonstrating training impact, ROI calculations

---

### Method 4: Stress Testing
**Steps:**
1. Select campaign with 10,000+ recipients
2. Run Scenario P (Perfect Storm): 95% / 85% / 70%
3. Monitor browser console for errors
4. Verify system performance
5. Check database size
6. Validate analytics calculations
7. Clear data when complete

**Best For:** Performance validation, capacity planning

---

## Recommended Testing Sequence

### Week 1: Baseline Understanding
**Goal:** Understand the range of scenarios

**Tasks:**
1. Run Scenario A (Untrained - High Risk)
2. Run Scenario B (Average Awareness)
3. Run Scenario C (Well-Trained)
4. Run Scenario D (Security-Conscious)
5. Document differences
6. Identify realistic baseline for your organization

---

### Week 2: Department Analysis
**Goal:** Identify vulnerable departments

**Tasks:**
1. Run Scenario E (IT/Security)
2. Run Scenario F (Finance/Executive)
3. Run Scenario G (Sales/Marketing)
4. Run Scenario H (HR)
5. Create vulnerability matrix
6. Plan targeted training

---

### Week 3: Attack Sophistication
**Goal:** Test template effectiveness

**Tasks:**
1. Run Scenario I (Basic Phishing)
2. Run Scenario J (Social Engineering)
3. Run Scenario K (Spear Phishing)
4. Compare which template is most effective
5. Select best template for real campaigns

---

### Week 4: Edge Cases
**Goal:** Validate system robustness

**Tasks:**
1. Run Scenario P (Perfect Storm)
2. Run Scenario Q (Security Champions)
3. Run Scenario R (Exactly 50% threshold)
4. Run Scenario S (Just below 50% threshold)
5. Verify system handles all cases
6. Document any issues

---

### Ongoing: Progressive Tracking
**Goal:** Measure training effectiveness over time

**Tasks:**
1. Run Scenario Y monthly
2. Track improvement trajectory
3. Report quarterly to leadership
4. Adjust training program based on results
5. Celebrate milestones

---

## Pro Tips for Effective Simulation

### 1. Document Everything
- Create a testing log with dates, scenarios, and results
- Screenshot analytics before/after simulations
- Export CSV data for long-term tracking
- Share results with stakeholders

### 2. Compare with Real Campaigns
- After running real campaigns, compare to simulated predictions
- Calibrate your simulation rates based on actual results
- Use real data to inform future simulations

### 3. Adjust Based on Results
- If real data differs significantly from simulations, refine rates
- Update scenarios based on organizational changes
- Account for seasonal variations

### 4. Use for Training
- Show simulated results during awareness training
- Demonstrate potential impact of clicking phishing emails
- Use worst-case scenarios to motivate behavior change

### 5. Test Before Production
- Always simulate new campaign templates before sending
- Verify manager notifications work correctly
- Ensure analytics calculations are accurate

### 6. Clear Data Between Tests
- Use **Clear Simulated Data** button between scenario runs
- Prevents data contamination
- Ensures clean test results

### 7. Export and Archive
- Export CSV after each major simulation
- Archive results for compliance/audit purposes
- Build historical dataset for trend analysis

---

## Troubleshooting Common Issues

### Issue: Simulation Takes Too Long
**Cause:** Large recipient list (10,000+ employees)

**Solution:**
- Expected: 2-10 seconds for 10,000 recipients
- If longer, check browser console for errors
- Clear browser cache and retry

---

### Issue: Manager Notification Not Triggered
**Cause:** Click rate below 50% or no manager email set

**Solution:**
1. Verify campaign has `manager_email` configured
2. Check click rate ≥ 50%
3. Ensure `enable_sending` is enabled (for email delivery)
4. Check console logs for email output

---

### Issue: Analytics Not Updating
**Cause:** Need to refresh after simulation

**Solution:**
- Analytics auto-refresh after simulation
- If not updating, manually refresh browser
- Check browser console for errors

---

### Issue: Can't Clear Simulated Data
**Cause:** Database permissions or locked records

**Solution:**
1. Try clearing again
2. Refresh browser
3. Check backend logs for errors
4. Restart backend server if needed

---

## Appendix: Simulation Rate Formulas

### Calculating Expected Events

Given:
- R = Total Recipients
- O = Open Rate (0-1)
- C = Click Rate (0-1)
- S = Submit Rate (0-1)

Expected Events:
- **Delivered**: R × 1.0 (always 100%)
- **Opened**: R × O
- **Clicked**: R × O × C
- **Submitted**: R × O × C × S

### Example Calculation

Campaign with 1,000 recipients:
- Open Rate: 60% (0.6)
- Click Rate: 30% (0.3)
- Submit Rate: 10% (0.1)

Expected:
- Delivered: 1,000 × 1.0 = **1,000**
- Opened: 1,000 × 0.6 = **600**
- Clicked: 1,000 × 0.6 × 0.3 = **180**
- Submitted: 1,000 × 0.6 × 0.3 × 0.1 = **18**

**Note:** Actual results will vary due to randomization

---

## Quick Reference Table

| Scenario | Open % | Click % | Submit % | Use Case |
|----------|--------|---------|----------|----------|
| A - Untrained | 80 | 60 | 40 | Baseline assessment |
| B - Average | 60 | 30 | 10 | Basic training |
| C - Well-Trained | 35 | 15 | 4 | After training |
| D - Security-Conscious | 20 | 8 | 1 | Best-in-class |
| E - IT/Security | 20 | 8 | 1 | Technical staff |
| F - Finance/Exec | 45 | 22 | 12 | High-value targets |
| G - Sales/Marketing | 70 | 40 | 18 | Customer-facing |
| H - HR | 60 | 35 | 20 | Resume scams |
| I - Basic Phishing | 50 | 20 | 8 | Low sophistication |
| J - Social Engineering | 65 | 38 | 15 | Medium sophistication |
| K - Spear Phishing | 80 | 55 | 35 | High sophistication |
| P - Perfect Storm | 95 | 85 | 70 | Worst case |
| Q - Security Champions | 5 | 2 | 0 | Best case |
| R - Threshold Test | 70 | 50 | 20 | Exactly at 50% |

---

## Conclusion

This simulation engine provides a powerful tool for:
- Testing campaign effectiveness before sending
- Validating system behavior under various conditions
- Training administrators on the platform
- Demonstrating training ROI to leadership
- Meeting compliance requirements
- Benchmarking against industry standards

Use these scenarios as a starting point and customize rates based on your organization's unique characteristics and training maturity.

**Questions?** Reference the main CLAUDE.md documentation for technical details.
