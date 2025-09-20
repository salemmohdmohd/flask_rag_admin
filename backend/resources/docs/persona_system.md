# AI Persona System

The RAG Admin system now includes a powerful persona system that allows you to dynamically switch between different AI expert modes to get specialized responses based on your needs.

## Available Personas

### 🔬 Business Data Analyst
**Best for:** Financial analysis, KPIs, data visualization, and business reporting
- Analyzes business metrics and trends
- Provides data-driven insights and recommendations
- Creates comprehensive reports with calculations and breakdowns

### 🚀 Career Consultant
**Best for:** Professional development, career transitions, and job search guidance
- Offers personalized career advice and strategies
- Provides interview preparation and resume guidance
- Suggests skill development and networking opportunities

### 🤖 General Assistant
**Best for:** General questions, task assistance, and various topics
- Helpful and versatile responses across different domains
- Clear explanations and step-by-step guidance
- Adaptable to different user needs and contexts

### 📱 Marketing Consultant
**Best for:** Digital marketing, brand strategy, and campaign development
- Develops marketing strategies and campaigns
- Analyzes customer behavior and market trends
- Provides ROI optimization and channel recommendations

### 📊 Management KPI Expert
**Best for:** Performance measurement, organizational effectiveness, and KPI design
- Creates KPI frameworks and measurement systems
- Provides performance improvement strategies
- Designs dashboards and reporting systems

### 📋 Project Manager
**Best for:** Project planning, execution, risk management, and team coordination
- Plans and executes projects across different methodologies
- Manages timelines, budgets, and resources
- Provides risk mitigation and stakeholder management

### 💰 Accountant
**Best for:** Financial reporting, compliance, accounting, and audit support
- Prepares and analyzes financial statements
- Ensures compliance with accounting standards
- Provides tax planning and budget analysis

### 🏢 Chief Executive Officer (CEO)
**Best for:** Strategic leadership, executive decisions, and organizational vision
- Sets strategic direction and vision
- Makes high-level business decisions
- Focuses on long-term value creation and stakeholder management

### 💼 Chief Financial Officer (CFO)
**Best for:** Financial strategy, corporate finance, and investor relations
- Develops financial strategy and planning
- Manages capital structure and investor relations
- Provides financial risk assessment and optimization

## How to Use Personas

### In the UI
1. **Select a Persona**: Use the dropdown in the main chat interface to choose your AI expert mode
2. **See Current Mode**: The interface shows which persona is currently active
3. **Dynamic Switching**: Change personas at any time during your conversation
4. **Persona-Specific Responses**: Each response will be tailored to the selected expert's domain

### Via API
```javascript
// Send a message with a specific persona
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "What are our Q3 financial highlights?",
    session_id: sessionId,
    persona_name: "business_data_analyst"  // Optional: specify persona
  })
})
```

## API Endpoints

### List Available Personas
```http
GET /api/personas
```
Returns all available personas with their metadata.

### Get Current Persona
```http
GET /api/personas/current
```
Returns the currently active persona.

### Switch Persona
```http
POST /api/personas/switch
Content-Type: application/json

{
  "persona_name": "career_consultant"
}
```

### Get Persona Details
```http
GET /api/personas/{persona_name}
```
Returns detailed information about a specific persona.

## Technical Architecture

### Persona Files
- **Location**: `backend/docs/personas/`
- **Format**: Markdown files with structured prompt templates
- **Customizable**: Add new personas by creating new `.md` files

### PersonaManager Class
- **Dynamic Loading**: Automatically loads all persona files
- **Context Management**: Maintains conversation context across persona switches
- **Prompt Generation**: Creates specialized prompts based on selected persona

### Pipeline Integration
- **Seamless Integration**: Works with existing RAG pipeline and semantic search
- **Conversation Memory**: Maintains context when switching between personas
- **Metadata Tracking**: Includes persona information in response metadata

## Adding New Personas

1. **Create Persona File**: Add a new `.md` file in `backend/docs/personas/`
2. **Define Structure**: Include role description, responsibilities, and expertise areas
3. **Update Configuration**: Add persona config in `PersonaManager` class
4. **Test Integration**: Verify the new persona loads and works correctly

Example persona file structure:
```markdown
# Your Persona Name

## Role Description
Brief description of the persona's role and expertise.

## Core Responsibilities
- List key responsibilities
- Areas of focus
- Specialized knowledge

## Analysis Approach
Detailed instructions on how this persona should analyze queries and provide responses.

## Expertise Areas
- Domain 1
- Domain 2
- Domain 3
```

## Benefits

- **Specialized Expertise**: Get responses tailored to specific professional domains
- **Context-Aware**: Each persona understands its role and provides relevant insights
- **Dynamic Switching**: Change expert modes during conversation as needed
- **Extensible**: Easy to add new personas for different specializations
- **Memory Retention**: Conversation context maintained across persona switches