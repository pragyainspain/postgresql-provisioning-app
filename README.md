# PostgreSQL Free Tier Provisioning App

This is a full-stack PostgreSQL provisioning application using modern technologies while using Copilot assistance throughout the development process.

**Initial Project Structure**
When starting the project, I used Copilot to help generate the basic folder structure and initial configuration files.

**Some of the prompts I used:**
- Depending on problem statement, suggest technologies that can be the best in terms of reliability, scalability and maintainability - along with the trade-offs.
- Design a scalable folder structure for a web application that separates concerns and follows industry best practices
- Create a TypeScript backend structure with Express, including proper tsconfig and package.json
- Set up a React TypeScript frontend with Vite and Tailwind CSS
- Create OAuth integration with github following security best practices and handling edge cases
- Create test data factories and mocks for login testing
- Review this code for potential security vulnerabilities and suggest improvements

I provided the requirements and let Copilot generate the scaffolding, then reviewed and modified based on assignment.

For the frontend components, I had a clear vision of the user experience I wanted but used Copilot to help implement the actual React components and Tailwind styling.

The business logic was my own design, but Copilot helped with implementation details and best practices.

I knew I needed to use react testing library to have the test suite and I used Copilot to help generate the test cases and setup.
- Jest and React Testing Library configuration
- Test case generation for components

How to run this project?
Backend:    cd backend
            npm install
            npm run dev

Frontend:   cd frontend
            npm install
            npm run dev

Default browser should auto-open at http://localhost:3000/

Note: Test login is provided for testing purposes which bypasses authentication, otherwise, OAuth using GitHub is integrated.