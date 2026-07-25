# Requirements Document

## Introduction

This feature creates a dedicated `/tools` page for EVPULSE that hosts four EV calculator tools (Charging, Savings, EMI, Range). The tools remain visible on the homepage and are additionally presented on their own route. The AI Chat widget integrates with the tools page to provide tab-specific contextual suggestions and vehicle recommendations based on calculator inputs.

## Glossary

- **Tools_Page**: The dedicated Next.js page rendered at the `/tools` route containing all four EV calculator tools
- **Calculator_Tabs**: The four switchable calculator interfaces — Charging Calculator, Savings Calculator, EMI Calculator, and Range Calculator
- **Active_Tab**: The currently selected and visible calculator tab on the Tools_Page
- **AI_Chat_Widget**: The floating chat popup component (`AiChatPopup`) that provides AI-powered vehicle assistance
- **Quick_Suggestion_Chips**: Clickable shortcut buttons displayed in the AI_Chat_Widget that pre-fill common queries relevant to the Active_Tab
- **Tool_Context**: Structured data describing the Active_Tab identity and current calculator input values, passed to the AI backend for contextual responses
- **Chat_API**: The backend route (`/api/chat`) that processes user messages with contextual system prompts via Cloudflare Workers AI
- **Homepage_Tools_Section**: The existing tools/calculator section within the EcosystemSection component on the homepage

## Requirements

### Requirement 1: Dedicated Tools Page Route

**User Story:** As a user, I want to access EV calculators on a dedicated page, so that I can use them without scrolling through the homepage.

#### Acceptance Criteria

1. WHEN a user navigates to `/tools`, THE Tools_Page SHALL render all four Calculator_Tabs (Charging Calculator, Savings Calculator, EMI Calculator, Range Calculator)
2. THE Tools_Page SHALL display the heading "Tools that do the maths for you."
3. THE Tools_Page SHALL use a background color of `#f8f5f0` and accent color of `#34ebb1` consistent with the site theme
4. THE Tools_Page SHALL default to the Charging Calculator as the Active_Tab on initial load

### Requirement 2: Tab Navigation

**User Story:** As a user, I want to switch between calculator tools using tabs, so that I can quickly access the calculator I need.

#### Acceptance Criteria

1. THE Tools_Page SHALL display tab controls for all four calculators (Charging, Savings, EMI, Range)
2. WHEN a user selects a tab, THE Tools_Page SHALL display the corresponding calculator and visually highlight the Active_Tab
3. THE Tools_Page SHALL render only one calculator at a time based on the Active_Tab selection

### Requirement 3: Calculator Functionality Parity

**User Story:** As a user, I want the calculators on the tools page to work identically to the homepage versions, so that I get consistent results regardless of where I use them.

#### Acceptance Criteria

1. THE Charging Calculator SHALL accept inputs for battery capacity (kWh), charger power (kW), start percentage, target percentage, and electricity rate (₹/kWh) and compute estimated charge time and cost
2. THE Savings Calculator SHALL accept inputs for daily kilometres, petrol price (₹/L), petrol mileage (km/L), electricity rate (₹/kWh), and years, and compute total savings and monthly breakdown
3. THE EMI Calculator SHALL accept inputs for vehicle price (₹), down payment percentage, loan tenure (years), and interest rate (%), and compute monthly EMI, total interest, and total payable amount
4. THE Range Calculator SHALL accept inputs for battery capacity (kWh), rated range (km), drive mode (eco/city/sport), terrain (flat/hilly), AC status (on/off), and passenger count, and compute estimated real-world range and energy efficiency (Wh/km)

### Requirement 4: Homepage Tools Section Retention

**User Story:** As a user, I want the tools section to remain on the homepage, so that I can still discover and use calculators without navigating away.

#### Acceptance Criteria

1. THE Homepage_Tools_Section SHALL continue to render all four Calculator_Tabs within the EcosystemSection component
2. THE Homepage_Tools_Section SHALL maintain identical calculator logic and UI as the Tools_Page

### Requirement 5: AI Chat Tab-Specific Quick Suggestions

**User Story:** As a user, I want the AI chat to show relevant quick suggestion chips based on which calculator I am using, so that I can get contextual help without typing.

#### Acceptance Criteria

1. WHILE the Active_Tab is Charging Calculator, THE AI_Chat_Widget SHALL display Quick_Suggestion_Chips including "Everyday up-down distance?", "Best charger for my EV?", and "Home charging cost?"
2. WHILE the Active_Tab is Savings Calculator, THE AI_Chat_Widget SHALL display Quick_Suggestion_Chips including "How much will I save?", "EV vs Petrol 5 years?", and "Break-even point?"
3. WHILE the Active_Tab is EMI Calculator, THE AI_Chat_Widget SHALL display Quick_Suggestion_Chips including "₹10,000/month budget EVs?", "Best loan tenure?", and "Lowest EMI EV?"
4. WHILE the Active_Tab is Range Calculator, THE AI_Chat_Widget SHALL display Quick_Suggestion_Chips including "Best range EV?", "Highway vs city range?", and "Range in winter?"
5. WHEN the user switches the Active_Tab, THE AI_Chat_Widget SHALL update Quick_Suggestion_Chips within the same render cycle

### Requirement 6: AI Chat Tool Context Awareness

**User Story:** As a user, I want the AI to understand which calculator I am using and what values I have entered, so that its responses are relevant to my current calculation.

#### Acceptance Criteria

1. WHILE the user is on the Tools_Page, THE AI_Chat_Widget SHALL detect the Active_Tab and include the tab identity in the Tool_Context sent to the Chat_API
2. WHILE the user is on the Tools_Page, THE AI_Chat_Widget SHALL include current calculator input values in the Tool_Context sent to the Chat_API
3. WHEN the Chat_API receives a Tool_Context, THE Chat_API SHALL incorporate the tool name and input values into the system prompt for contextual responses

### Requirement 7: AI Vehicle Recommendations from Calculator Inputs

**User Story:** As a user, I want the AI to recommend vehicles based on my calculator inputs, so that I can find EVs that match my budget and requirements.

#### Acceptance Criteria

1. WHEN a user asks for vehicle recommendations while using the EMI Calculator, THE Chat_API SHALL filter and suggest vehicles whose price falls within the loan amount implied by the current EMI inputs
2. WHEN a user asks for vehicle recommendations while using the Range Calculator, THE Chat_API SHALL suggest vehicles whose rated range meets or exceeds the user's desired range parameters
3. WHEN a user asks for vehicle recommendations while using the Savings Calculator, THE Chat_API SHALL provide context-aware savings comparisons using the user's entered fuel costs and driving distance
4. WHEN a user asks for vehicle recommendations while using the Charging Calculator, THE Chat_API SHALL suggest vehicles compatible with the charger power level entered by the user

### Requirement 8: Tools Page Pathname Detection

**User Story:** As a developer, I want the AI Chat widget to detect the `/tools` route, so that it activates tools-specific behaviour automatically.

#### Acceptance Criteria

1. WHEN the current pathname is `/tools`, THE AI_Chat_Widget SHALL activate tools-page-specific context and Quick_Suggestion_Chips
2. WHEN the current pathname changes away from `/tools`, THE AI_Chat_Widget SHALL revert to default or new-page-specific behaviour
3. THE AI_Chat_Widget SHALL use the existing `usePathname` hook for route detection without additional dependencies

### Requirement 9: Shared Calculator Component

**User Story:** As a developer, I want the calculator logic to be extracted into a reusable component, so that the homepage and tools page stay in sync without code duplication.

#### Acceptance Criteria

1. THE Calculator_Tabs SHALL be implemented as a shared component importable by both the Tools_Page and the Homepage_Tools_Section
2. IF the shared component is modified, THEN THE changes SHALL be reflected on both the Tools_Page and the Homepage_Tools_Section without separate updates
