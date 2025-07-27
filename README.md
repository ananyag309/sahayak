
# 🌟 Google Agentic AI Hackathon Submission

Welcome to our innovative, AI-powered learning assistant created as part of the **Google Agentic AI Hackathon**. This project is designed to empower students and teachers in under-resourced classrooms with multimodal and multilingual support — from smart worksheets and diagrams to visual stories and speech assessments.

---

## 🧠 What We Built

Our application is a **modular, intelligent learning assistant** powered by **Google Gemini models**, using structured and agentic AI design principles. It supports:

- ✍️ Natural conversation with voice/text/image input  
- 📚 Worksheet generation from textbook photos  
- 🧾 Lesson plan generation  
- 🧠 Concept visualization via diagrams  
- 🎞️ Visual stories with narration + image scenes  
- 🧑‍🏫 Reading assessments from student audio  
- 📋 Flashcard & game generation  
- 🧮 Homework + answer key generation

---


## 📦 Google Technologies Used

| Google Technology                        | Use Case in Our Project                                                                                   |
|------------------------------------------|------------------------------------------------------------------------------------------------------------|
| **Google Gemini 1.5 Flash**              | Main model for content generation including: explanations, worksheets, stories, lesson plans, and audio analysis. |
| **Google Gemini 2.0 Flash Preview (Image Gen)** | Used to generate educational diagrams, flashcard images, and visual story scenes based on prompts.       |
| **Genkit (by Google)**                   | AI development framework used to define, organize, and manage flows like `aiChatFlow`, `generateLessonPlanFlow`, etc. |
| **Google ADK Agents**                    | Used to define agentic behavior and orchestrate complex multi-step flows, especially for visual storytelling and flashcards. |
| **Firebase (Google Cloud)**              | Used for hosting the frontend and deploying our entire app. Easily integrates with Google’s AI stack.     |
| **Google Cloud Functions (via Firebase Studio)** | Allows us to run server-side Genkit flows and trigger agents on demand.                                  |
| **Handlebars in Genkit Prompts**         | Enables conditional prompt structure (e.g. `{{#if imageDataUri}}`) to dynamically customize input to Gemini. |

---

## 🛠️ Tech Stack

| Category            | Tools Used                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| **Frontend**        | Next.js (on Firebase Studio), Tailwind CSS                                  |
| **AI Models**       | `googleai/gemini-1.5-flash-latest` (text/audio), `gemini-2.0-flash-preview-image-generation` (image) |
| **AI Framework**    | [Genkit](https://github.com/genkit-dev/genkit)                             |
| **Agents Platform** | Google ADK Agents                                                           |
| **Text-to-Speech**  | [ElevenLabs](https://www.elevenlabs.io/)                                   |
| **Schema Validation** | Zod                                                                      |
| **Deployment**      | Firebase Hosting                                                            |

---

## 🧩 Core AI Flows and Features

### 1. 🧑‍🏫 AI Teaching Chatbot
- **Input**: Question + optional image + language
- **Flow**: `aiChatFlow`
- **How it works**: Uses a single structured prompt (Handlebars) to act as a multilingual teaching assistant.
- **Output**: Explanation/story/analogy in chosen language.

---

### 2. 📸 Textbook to Worksheet Generator
- **Input**: Textbook photo + curriculum
- **Flow**: `textbookScannerFlow`
- **Process**: 
  - Identify image language and grade
  - Generate MCQs, fill-in-the-blanks, matching questions
- **Output**: Structured worksheet as JSON

---

### 3. 🖍️ Diagram Generator
- **Input**: Topic string
- **Flow**: `generateDiagramFlow`
- **How it works**: Direct image generation using Gemini 2.0
- **Output**: Chalkboard-style image (base64 string)

---

### 4. 🎬 Visual Story (Most Agentic)
- **Input**: Concept
- **Flow**: `generateVisualStoryFlow`
- **Agentic Behavior**:
  - **Plan**: Text AI creates scene list with narration and image prompts
  - **Execute**: Generate image for each prompt (in parallel)
  - **Combine**: Merge narration + images into a story
- **Output**: Visual story JSON

---

### 5. 🎤 Reading Coach & Fluency Analyzer
- **Input**: Original passage, student audio, word count, duration
- **Flow**: `assessReadingFlow`
- **Process**:
  - Calculate WPM
  - Compare passage vs audio
  - Identify errors, accuracy, mispronunciations
- **Output**: JSON with score, feedback, and error list

---

### 6. 📅 Weekly Lesson Plan Generator
- **Input**: Grade, subject, topic
- **Flow**: `generateLessonPlanFlow`
- **Process**:
  - AI acts as a teacher’s aide for Indian classrooms
  - Generate 5-day plan + improvement tips
- **Output**: Structured JSON + cultural recommendations

---

## 🎯 Additional Flows

| Feature              | Description |
|----------------------|-------------|
| 📖 **Homework Generator** | Two steps: one flow for student sheet, another for answer key. Separation of concerns using `generateHomeworkSheetFlow` and `generateAnswerKeyFlow`. |
| 🧠 **Flashcard Creator** | Two-stage: `generateFlashcardsFlow` for text + prompts, then `generateFlashcardImageFlow` for visual cards. |
| 🎮 **Game Generator** | Generates full educational games (title, theme, questions, answers) using `generateGameFlow`. |

---

## 🧬 Agentic Design Highlights

- **Agentic Architecture**: Our **Visual Story Generator** showcases true agentic behavior:
  - Step 1: Think (plan scenes & prompts)
  - Step 2: Act (execute each image gen separately)
  - Step 3: Reflect (combine into one result)

- **Modular Flows**: Built with Genkit flow architecture for reusability and clarity.

- **Parallel Execution**: Leveraged `Promise.all` for concurrent image generation.

---

## 🧠 Google Tools Used

| Tool                     | Purpose                              |
|--------------------------|--------------------------------------|
| **Gemini 1.5 Flash**     | Text, language understanding, audio |
| **Gemini 2.0 Flash**     | Image generation                     |
| **Genkit**               | AI orchestration framework           |
| **Firebase**             | Hosting + cloud functions            |
| **Google ADK Agents**    | Agent orchestration and composition  |

---

## 🔊 Other Tools

- **ElevenLabs TTS** – For voice-based narration in flashcards and stories
- **Zod Schemas** – Strong typing & validation for all AI outputs

---

## 💡 Why This Matters

In many Indian schools, a **single teacher handles multiple grades** with little support. Our AI tool assists these educators by:

- Reducing prep time
- Adapting content to students’ levels
- Supporting **multilingual & multimodal** inputs
- Offering culturally contextual and accessible teaching aids

---

## 📁 Folder Structure (Highlights)

```
├── src/
│   └── ai/
│       ├── genkit.ts               # AI Model setup
│       ├── flows/
│       │   ├── ai-chat-assistant.ts
│       │   ├── textbook-scanner.ts
│       │   ├── diagram-generator.ts
│       │   ├── video-generator.ts
│       │   ├── reading-assessor.ts
│       │   └── lesson-planner.ts
│       └── prompts/                # Handlebars and structured prompts
```

---

## 🚀 Future Improvements

- Add Gemini 1.5 Pro or Gemini 2 for enhanced planning
- Add data persistence with Firebase Firestore
- Integrate teacher dashboards with lesson tracking
- Local language voice narration for every feature

---

## 👥 Team

Made with ❤️ by a passionate team at the **Google Agentic AI Hackathon 2025**.
