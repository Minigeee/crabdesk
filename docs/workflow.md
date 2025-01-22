# AI Coding Workflow

## Goal

- The goal is to have a near fully automated app development workflow
- The role of the human orchestrator is just to nudge the AI agents in the right direction as it works along

## Challenges

- One of the biggest challenges when using AI first development currently is that it is easy for AI agents to be inconsistent in code style and best practices
- AI agents will also sometimes make certain decisions, whether technical implementation or product decision, that does not always align with what the orchestrator wants
- When given vague goals and tasks, the methods an AI agent uses to implement is inconsistent
- AI agents do not plan for the future very well with respect to product development - they often choose (on average) the best options they have to carry out their immediate task. This method may work for single tasks, but when taking the entire chain of tasks required to develop a product, it may not be the best choice.
  - Therefore it is the role of the orchestrator to provide the structure and direction needed for AI agents to carry out its tasks effectively

## Workflow

### Part 1: Creating the Project Document

This document will set the vision and the direction for the project

#### 1. Project Description / Summary

- Provide a high-level overview of the app:
  - Purpose and goals
  - Problem it solves
  - Benefits to users
  - Outline the vision and value proposition

#### 2. Target Users

- Identify primary and secondary audiences:
  - Demographics (age, location, etc.)
  - Needs and pain points
  - Preferences and behaviors
  - Define user personas and their characteristics

#### 3. Project Requirements

- List key features and functionalities:
  - Core user interactions
  - Must-have capabilities

#### 4. Core Features and Systems

- Define major systems and features
  - Example for CRM app: ticket system, customer communication system (real-time, email), user dashboard, role-based access system, automation systems, organizations, analytics, etc.
  - This will be used to lay out a roadmap for the project
  - Describe how these systems interact and support the app's goals

#### 5. Data Model

- Define the data entities and their relationships:
  - Key data types (e.g., user profiles, transactions)
  - Data flow between systems
  - Storage and retrieval needs
  - This will be used to lay out the requirements for the database schema - the data should serve the needs of the project requirements and core features

#### 6. Success Criteria

- Define the success criteria for the project:
  - Key performance indicators (KPIs)
  - User acceptance criteria
  - Compliance benchmarks

#### 7. Tech Stack

- Describe the tech stack that will be used in the project:
  - Frameworks
  - Libraries
  - Tools and technologies
- Describe the external services that will be used in the project:
  - Third-party APIs
  - Payment gateways
  - Authentication providers
  - Analytics and reporting tools

#### 8. Deployment and Operations

- Describe the QA and deployment process:
  - Hosting platform and infrastructure
  - Monitoring and maintenance needs

### Part 2: Establish Conventions

- Determine what coding style and conventions will be used
- Download a pre-made .cursorrules file and customize it to suit the needs of the project

#### 1. Common Systems

- These are systems, components, and snippets that will be used throughout the project, and are often not pieces unique to any single type of project
  - Utility files
  - Commonly used components
  - Error handling system

#### 2. Data Interface
This section will describe how data will be fetched and mutated. Often times, it will always be the same between projects.

- Always use an abstraction layer when doing any data fetching or mutations, for both client and server side
- Fetch data on server side in server components whenever possible
- If data is expected to change within the timeframe of a single session, use server side fetching to seed the initial data, then use react-query to manage refreshing and stale data
- When doing any client-side data fetching, use react-query
- When doing mutations, use server actions if data is otherwise not expected to change much within a single session
- If using react-query to manage data fetching, also use it for mutations if mutations are needed
- If dealing with fast real-time data (such as messages), use optimistic updates paired with some form of client side data management (i.e. custom data management through a Provider and Context, or react-query, etc.)

#### 3. Best Practices

- For React based frameworks: favor using useMemo, useEffect, and useCallback for performance
- When using server side fetching procedures, use React cache() to avoid double fetches
- Use layouts paired with provider components to provide server-side data fetches to client components (nested)

### Part 3: App Structure

- Create a document that outlines app structure
- Apps are large, so it is better to outline how all the core systems and features will fit together, and how they will consume the data model to display to the user before starting development
- This document should consider the project requirements, core features & systems, and the desired user experience into account when designing the structure

#### Step 1

Start by creating a vague outline of the front-end views the user will be exposed to. Think about which views each user role (if using roles such as admin, client, etc.) will be exposed to, and how each view changes based on who is viewing it.

- This outline should be vague, component of the outline should generally describe a view or feature without describing the specific UI components that will be used to create the view
- By the time the vague outline is created, you should be able to answer each of the following for each component of the outline:
  - Why does this view / feature exist?
  - What purpose does it serve in the project?
  - Who will be using this view?
  - What is the user flow expected to be like? How does a user access it?

#### Step 2

For each part of the vague outline, drill into the details a little more

- Start answering these questions:
  - What components will be needed to achieve the purpose of the front-end view?
  - What will interactions with the key components do? Will it bring up a dialog with a form? Will I need to confirm a certain action? Does it sort this table? Does it link to another page?
  - What will the general layout of the view look like? Will there be a sidebar for info or nav? Will there be a header there? Should we include a breadcrumb component?

- The purpose is to establish the functionality of each view and its components
- Iterate over each of these components as you go

#### Step 3

- Create the app structure
- Using the detailed outline, create a directory like structure of your app
- For web projects, this should be the route structure of your web app

### Part 4: Actionable Steps

- The first three parts were mostly planning. This part will be about implementation and execution
- This part will last throughout the rest of the project, it is an iterative step, along with the following parts
- With your app structure and main project document, the goal of this part is to start creating actionable steps you can feed to the coder agent

#### Step 1: Set up the project

- Create the Next app
- Add all needed libraries (shadcn, supabase, etc.)
- Copy in or create global common files (utilities, common components, etc.)
- Set up basic auth flow

#### Step 2: Create the database schema

- You should have a mostly completed data model… use it to create a schema and populate your database with tables and indices
- Create corresponding types (Typescript)
- Do not create the data interface layer yet, the needs for those are a little more fluid so they should be created on demand

#### Step 3: Choose an app structure view to focus on

This is the view that will be the focus of the next steps

#### Step 4: Split into actionable tasks

- Ask an AI to split the implementation of the view into an actionable road map with actionable tasks
- Start by describing each task in one or two short sentences
- Since we are building a product from the ground up, we should focus only on the most important features and systems first
- Order the tasks so that the most foundational features and systems are implemented first. If a feature is dependent on another feature, it should be implemented after the feature it depends on
- Add annotations on which route a feature belongs to, if applicable

#### Step 5: Add more details

- This should build on the previous step
- Add more details to each task, and add/remove tasks as needed. Each task should now be detailed enough for the coder agent that will be implementing it to understand everything we determined in the previous App Structure phase:
  - Feature requirements
  - Why the task/feature is needed
  - How it fits into the overall product
  - Which user types will have access to or use the feature
  - The user experience the feature should provide

#### Step 6: Feed the tasks to the model and repeat until done

- Guide the model as you go
- The model should understand how to interface with data, coding conventions, best practices (from the cursor rules)
- It should also understand how to implement the task, how it fits into the app, etc. (from the context and app structure document)

#### Step 7: Repeat steps 3-6 until the product is where you want it to be

- This is an iterative process, and the goal is to get the product to a point where it is where you want it to be
- The goal is to get the product to a point where it is where you want it to be
