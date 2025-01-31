# AI Workflow Test Scenarios

## Overview

This document contains test scenarios for validating the AI workflow in CrabDesk, focusing on ticket initialization and multi-step interactions. Each scenario includes expected outcomes for validation.

## Test Environment Setup Notes

- All scenarios assume a fresh environment with no existing contacts
- Each scenario builds the contact database progressively
- Priority levels and response quality should be validated for each interaction

## Initial Contact Scenarios

### SC-001: Basic Residential Quote Request

**Initial Email**:

```
From: sarah.johnson@email.com
Subject: Solar Panel Installation Quote
Body: Hi, I'm interested in getting solar panels installed at my new home in Austin.
It's a 2,500 sq ft single-story house. Could you provide information about your
basic solar package and pricing? Thanks, Sarah
```

**Expected Outcomes**:

- New contact created for Sarah Johnson
- Priority: Normal
- Category: Sales Inquiry
- Auto-response should include:
  - SolarTech Home Basic package details
  - Initial pricing range
  - Request for site assessment
  - Financing options overview

**Follow-up Interaction**:

```
From: sarah.johnson@email.com
Subject: Re: Solar Panel Installation Quote
Body: Thanks for the information. I'm interested in the SolarTech Home Basic package.
Could we schedule a site assessment next week? I'm also wondering if the 10-year
warranty covers panel replacement?
```

**Expected Outcomes**:

- Priority maintained as Normal
- Response should include:
  - Site assessment scheduling options
  - Detailed warranty information
  - Upsell opportunity for Premium package with 25-year warranty

### SC-002: Urgent System Failure (Medical Equipment)

**Initial Email**:

```
From: robert.chen@email.com
Subject: URGENT - Complete System Failure - Medical Equipment at Risk
Body: Our entire solar system and battery backup installed last month has stopped working.
We have medical equipment that requires constant power. Need immediate help.
Address: 1234 Oak Street, Houston.
```

**Expected Outcomes**:

- New contact created for Robert Chen
- Priority: Urgent
- Category: Technical Support - Emergency
- Auto-response should include:
  - Emergency protocol acknowledgment
  - Immediate troubleshooting steps
  - Technical support contact number
  - ETA for emergency response

**Follow-up Interaction**:

```
From: robert.chen@email.com
Subject: Re: URGENT - Complete System Failure - Medical Equipment at Risk
Body: Thank you for the quick response. I've tried the reset procedure you suggested
but the system is still down. The battery shows a red light now.
```

**Expected Outcomes**:

- Priority remains Urgent
- Response should include:
  - Dispatch confirmation for emergency technician
  - Additional safety instructions
  - Temporary power solution suggestions

### SC-003: Commercial Multi-Site Inquiry

**Initial Email**:

```
From: maria.garcia@bigretail.com
Subject: Solar Installation for Multiple Retail Locations
Body: I'm the facilities manager for BigRetail Corp. We're interested in solar
installation for our 5 locations in Texas. Looking for information on your commercial
solutions and bulk pricing. Need ROI calculations for each site.
```

**Expected Outcomes**:

- New contact created for Maria Garcia
- Priority: High
- Category: Commercial Sales
- Auto-response should include:
  - SolarTech Enterprise solution overview
  - Commercial case studies
  - Site assessment process for multiple locations
  - ROI calculation methodology

**Follow-up Interaction**:

```
From: maria.garcia@bigretail.com
Subject: Re: Solar Installation for Multiple Retail Locations
Body: Thanks for the detailed information. Could you provide specific details about
your monitoring system for multiple locations? Also, do you offer centralized
billing for all sites?
```

**Expected Outcomes**:

- Priority maintained as High
- Response should include:
  - SolarTech Monitor enterprise features
  - Multi-site management capabilities
  - Billing consolidation options
  - Proposal for technical consultation

### SC-004: Post-Storm Damage Assessment

**Initial Email**:

```
From: david.smith@email.com
Subject: Damage to Solar Panels After Storm
Body: We had a severe storm last night and I noticed some panels appear to be
damaged. System is showing reduced output. Need someone to check ASAP.
Installation was done 6 months ago.
```

**Expected Outcomes**:

- New contact created for David Smith
- Priority: High
- Category: Technical Support - Weather Damage
- Auto-response should include:
  - Safety instructions
  - Remote diagnostic initiation
  - Warranty coverage confirmation
  - Temporary performance expectations

**Follow-up Interaction**:

```
From: david.smith@email.com
Subject: Re: Damage to Solar Panels After Storm
Body: I checked the system performance data you requested. Output is at 40% of normal.
Attached are photos of the visible damage. When can someone come out to assess?
```

**Expected Outcomes**:

- Priority remains High
- Response should include:
  - Damage assessment appointment options
  - Insurance claim guidance
  - Temporary system optimization suggestions

### SC-005: Smart Home Integration Query

**Initial Email**:

```
From: lisa.wong@email.com
Subject: Smart Home Integration with Existing System
Body: We have your basic solar system installed last year. Interested in upgrading
to the smart home features. Can you tell me about compatibility with Nest and
Ring devices? Also interested in battery storage options.
```

**Expected Outcomes**:

- New contact created for Lisa Wong
- Priority: Normal
- Category: Sales - Upgrade
- Auto-response should include:
  - SolarTech Smart Home features
  - Compatibility list
  - Battery storage options
  - Upgrade process overview

**Follow-up Interaction**:

```
From: lisa.wong@email.com
Subject: Re: Smart Home Integration with Existing System
Body: The smart home features look great. Two questions: 1) Can I monitor and
control everything from one app? 2) What's the typical installation timeline
for the upgrade?
```

**Expected Outcomes**:

- Priority maintained as Normal
- Response should include:
  - App functionality details
  - Installation timeline
  - Integration process steps
  - Upgrade package pricing

### SC-006: Performance Optimization Request

**Initial Email**:

```
From: james.wilson@email.com
Subject: System Performance Below Expectations
Body: Our system was installed 3 months ago and we're not seeing the energy savings
promised. Monthly bills are only 15% lower instead of the projected 40%.
Need someone to look into this.
```

**Expected Outcomes**:

- New contact created for James Wilson
- Priority: High
- Category: Technical Support - Performance
- Auto-response should include:
  - Initial diagnostic questions
  - Performance data request
  - Usage pattern analysis
  - Optimization suggestions

**Follow-up Interaction**:

```
From: james.wilson@email.com
Subject: Re: System Performance Below Expectations
Body: I've attached our last 3 months of power bills and the performance data
you requested. Our energy usage hasn't changed significantly from before
the installation.
```

**Expected Outcomes**:

- Priority maintained as High
- Response should include:
  - Detailed performance analysis
  - Specific optimization recommendations
  - Site visit scheduling if needed
  - Performance guarantee review

### SC-007: Battery Storage Emergency

**Initial Email**:

```
From: emily.brown@email.com
Subject: Battery Not Working During Power Outage
Body: We're currently in a power outage and our backup battery isn't working.
The system shows error code E-443. This is our first outage since installation
last month.
```

**Expected Outcomes**:

- New contact created for Emily Brown
- Priority: Urgent
- Category: Technical Support - Emergency
- Auto-response should include:
  - Immediate troubleshooting steps
  - Emergency contact numbers
  - Safety instructions
  - System status check procedure

**Follow-up Interaction**:

```
From: emily.brown@email.com
Subject: Re: Battery Not Working During Power Outage
Body: Followed the reset procedure but still getting the error. Battery display
shows 0% even though it was at 98% before the outage.
```

**Expected Outcomes**:

- Priority remains Urgent
- Response should include:
  - Advanced troubleshooting steps
  - Emergency service dispatch details
  - Temporary power recommendations

### SC-008: Commercial Monitoring System Issue

**Initial Email**:

```
From: thomas.anderson@techcorp.com
Subject: Enterprise Monitoring System Down
Body: The SolarTech Monitor platform for our 3 office locations has been
unresponsive for the last hour. Can't access any performance data or
control systems. This is affecting our operations.
```

**Expected Outcomes**:

- New contact created for Thomas Anderson
- Priority: High
- Category: Technical Support - Software
- Auto-response should include:
  - System status check
  - Alternative monitoring methods
  - Initial troubleshooting steps
  - Service status update

**Follow-up Interaction**:

```
From: thomas.anderson@techcorp.com
Subject: Re: Enterprise Monitoring System Down
Body: The system came back online but shows incorrect data. All locations are
showing zero production despite sunny conditions. Need this fixed ASAP.
```

**Expected Outcomes**:

- Priority maintained as High
- Response should include:
  - Data validation process
  - Real-time monitoring check
  - Technical support escalation
  - Timeline for resolution

### SC-009: Warranty Claim Investigation

**Initial Email**:

```
From: karen.martinez@email.com
Subject: Panel Degradation Warranty Claim
Body: We've noticed significant degradation in our panels after just 1 year.
Output has dropped by 30% according to our monitoring system. This should
be covered under warranty. Need this investigated.
```

**Expected Outcomes**:

- New contact created for Karen Martinez
- Priority: High
- Category: Customer Service - Warranty
- Auto-response should include:
  - Warranty coverage confirmation
  - Performance data request
  - Investigation process overview
  - Temporary timeline estimate

**Follow-up Interaction**:

```
From: karen.martinez@email.com
Subject: Re: Panel Degradation Warranty Claim
Body: Attached is the performance data for the past year showing the decline.
Also including photos of the panels showing visible discoloration.
```

**Expected Outcomes**:

- Priority maintained as High
- Response should include:
  - Detailed analysis of provided data
  - Warranty claim process steps
  - Inspection scheduling
  - Temporary performance expectations

### SC-010: Mobile App Technical Support

**Initial Email**:

```
From: michael.taylor@email.com
Subject: Can't Access Mobile App
Body: Getting "Authentication Failed" error when trying to log into the SolarTech
mobile app. Tried resetting password but not receiving reset emails. Need access
to monitor my system.
```

**Expected Outcomes**:

- New contact created for Michael Taylor
- Priority: Normal
- Category: Technical Support - Software
- Auto-response should include:
  - Basic troubleshooting steps
  - Alternative access methods
  - Account verification process
  - App version check

**Follow-up Interaction**:

```
From: michael.taylor@email.com
Subject: Re: Can't Access Mobile App
Body: Tried all suggested steps but still can't log in. The web portal works
fine, it's just the mobile app that's having issues. Using latest app version.
```

**Expected Outcomes**:

- Priority escalated to High
- Response should include:
  - Advanced troubleshooting steps
  - App reinstallation guide
  - Alternative monitoring options
  - Technical support escalation

## Test Validation Criteria

### For Each Scenario

1. Contact Creation

   - Verify correct contact details captured
   - Check organization association
   - Validate contact history initialization

2. Ticket Processing

   - Confirm correct priority assignment
   - Verify category classification
   - Check response time metrics
   - Validate thread summarization

3. Response Quality

   - Verify information accuracy
   - Check tone appropriateness
   - Validate solution completeness
   - Confirm follow-up requirements

4. Knowledge Base Utilization

   - Verify relevant article references
   - Check information accuracy
   - Validate context appropriateness

5. Workflow Progression
   - Confirm proper escalation paths
   - Verify status updates
   - Check automation effectiveness
   - Validate human oversight triggers

## Test Execution Notes

1. Run scenarios in sequence to build contact database naturally
2. Document any unexpected AI behavior or response patterns
3. Track response quality metrics for continuous improvement
4. Note any knowledge base gaps identified during testing
5. Monitor system learning and adaptation across scenarios
