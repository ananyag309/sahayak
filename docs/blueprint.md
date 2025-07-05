# **App Name**: Sahayak AI

## Core Features:

- AI Chat: AI Chat Assistant: User enters a question in English or a local language, and Gemini returns stories, analogies, or concept explanations. This tool uses language selection and voice input, and allows copying and downloading of the output.
- Textbook Scanner: Textbook Scanner: Extracts text from uploaded textbook photos (stored in Firebase Storage) using Gemini Vision and generates MCQs, fill-in-the-blanks, and match-the-column questions.
- Diagram Generator: Diagram Generator: Generates SVG or PNG chalkboard-style diagrams from a topic name or concept. Users can download the diagrams and store the URL in Firestore.
- Reading Assessment: Reading Assessment: Records student reading audio, uses Vertex AI Speech-to-Text to provide a fluency score, identifies mispronounced words, and offers suggestions. Results are saved under the user ID in Firestore.
- Lesson Planner: Lesson Planner: Gemini returns a weekly lesson plan, given a subject, grade, and topic. Plans are stored in Firestore.
- Game Generator: Game Generator: Input the topic and grade and Gemini returns quiz or game logic, available for download in printable or interactive format.
- User Authentication: Secure authentication via Firebase Auth, supporting email/password signup/login, user data storage in Firestore, and route protection.

## Style Guidelines:

- Primary color: Deep violet (#7C3AED), to represent creativity and intelligence.
- Background color: Light lavender (#F5F3FF), offering a calm and clean backdrop.
- Accent color: Warm yellow (#FBBF24), used for calls to action to draw the user's attention to key interactive elements.
- Body and headline font: 'Inter' (sans-serif) for a modern and accessible feel.
- Use simple, clear icons from a set like Material Design to ensure ease of understanding and a consistent user experience.
- Implement a responsive layout using Tailwind CSS grid and flexbox to adapt seamlessly to different screen sizes and devices.
- Use subtle animations from Framer Motion to enhance user engagement and provide feedback for interactions, maintaining a smooth and delightful experience.