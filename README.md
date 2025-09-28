# Be Aware

## 👤 Inspiration

## 🪄 What it does
Be Aware is an AI-assisted journaling tool designed to help users reflect on their daily experiences, recognize emotional patterns, and take small, actionable steps toward mental wellbeing. Using AI insights and a minimalist interface, it:  

- **Allows Unlimited Journaling:** The app lets users write as often as they want everyday, encouraging frequent expression and daily habit building.  
- **Creates a Peaceful Space:** Through a clean and minimal journaling environemnt, the user interface reduces distractions and inspires reflection, whether for today or over the past week. The UI includes changing backgrounds and a collapsable sidebar.
- **Prompts Deeper Reflection:** The website uses AI tooltips and guiding questions to nudge users toward more thoughtful and meaningful entries. A lightbulb appears after 5 seconds of inactivity and prompts the user with questions.  
- **Analyzes Emotional Trends:** The insight page delivers AI-driven insights into a user’s emotions across daily, weekly, or monthly timelines.  
- **Visualizes Insights Clearly:** The site transforms journal entries and emotional data into simple, easy-to-read graphs that highlight patterns and changes. The page includes pie charts, bar-line charts, area charts, and a core emotion plot.
- **Suggests Actionable Habits:** We offer tailored AI tips tied to each graph and past journal entries, suggesting possible habit adjustments that may improve mental health over time.

## 🖥️ How we built it
We combined modern web frameworks with AI workflow an inviting journaling experience:

Languages: TypeScript (backend), JavaScript (frontend), CSS
Frontend: Handlebars (templated HTML)
Backend: Node.js (Koa)
Database: MongoDB
AI Workflow: Mastra

- **Login:** The user login system is done through a simple email and password login, storing the user's email and hashed password in the database.
- **Journaling:** While the user is journaling, the app tracks inactivity while writing. After 5 seconds of inactivity, the app sends a request to an AI tooltip Mastra workflow, prompting gpt-4o-mini for a tooltip.
- **Sentiment Analysis:** Once a journal is submitted and stored in the database, an array of sentiment values is assigned to the journal based on each emotion: [Happiness, Sadness, Fear, Disgust, Anger, Surprise]. This is done through a separate sentiment anaylsis workflow.
- **Graph Analysis:** Through chart.js, the app creates the graphs in the backend, sending them to the frontend for display. Graphs include pie charts, area charts, bar-line charts, and a core emotion chart. 
- **Insight Analysis:** The app shows personalized AI insight tips under each graph to improve long-term mental health. These tips are collected through a separate tips workflow.

## 😥 Challenges we ran into
Deciding to work on this idea as a team of two, we had to greatly split up the workload and manage our time effectively.
- **Mastra Integration:** Connecting Mastra into our existing web framework required exposing multiple dedicated endpoints for AI workflows, which we solved by routing requests between our website and the Mastra backend.
- **Balancing Design Goals:** Striking the right balance between minimalism, usability, and inspiration was tricky. We solved this with subtle design touches; we added simple switchable backgrounds for journal pages and an inviting gradient landing page reflecting the “colors of emotion.” Furthermore, the UI included designing a comfortable sidebar that could collapse/expand smoothly while keeping icons visible proved challenging, especially with CSS transitions on width changes.
- **Pagination & Graph Carousel:** Creating a system to flip through journals and graphs without clutter led us to build a custom objects (`window.JournalPager`) and (`window.GraphCarousel`) that manages cached data, tooltips, and navigation.  
- **Performance Optimization:** To keep the platform lightweight, we downsized assets, cached processed data, and wrote clean, simple code that loads quickly. For example, unsplash backgrounds stored in the sidebar would lag the animations, leading us to downsize the background images. 
- **AI Tip Uniqueness:** Early tests showed repetitive AI insight suggestions Through adjusting our prompts to the insight tips workflow and increasing the model's temperature, we managed to improve the model's variety and usefulness of graph-linked AI tips.

## 🏆 Accomplishments that we're proud of
- **Product we use**: We shipped a journaling app that we are excited to open every day, not just demo. Disregarding the fact that this is a hackathon, we both look forward to developing journaling habits everyday and using the AI to better out mental health. We can form consistent reflection habits, track emotional patterns, and nudge small improvements in mental health.
- **Minimalistic UI** We focused on calm typography, breathing room, and gentle animations so writing stays front and center. The collapsible sidebar, switchable backgrounds, and accessible navigation make the experience welcoming without being cluttered. The result invites reflection without distraction.
- **AI for habits** Beyond sentiment, our AI offers reflective prompts, allowing users to make concrete plans on mental health improvement.

## 🧑‍🏫 What we learned

## 🔮 What's next for BeAware: AI Journal

### 🚀 GitHub and Running

Check out the [repo](https://github.com/25DanielG/be-aware).  

- **/** – TypeScript + Koa server
- **/mastra** – AI workflow

1. Clone the repository.  
2. Run `npm install` in both `/` and `/mastra`.  
3. Rename the `config/exampleapiconfig.ts` to `config/apiconfig.ts`.
4. Create a `mastra/.env` file and fill in `OPENAI_API_KEY=<>`
4. Start the koa server with `npm run build` and `npm run dev` in `/`.  
5. Start mastra with `npm run build` and `npm run dev` in `/mastra`.

Once both are running, the app is on **http://localhost:2329**.