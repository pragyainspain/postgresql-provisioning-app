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
Here are some of the screen captures:
![image](https://github.com/user-attachments/assets/4bf66935-67bb-496f-bdee-768da884e598)
![image](https://github.com/user-attachments/assets/df18e984-c3b0-4537-ad21-b6f6a94638f1)
![image](https://github.com/user-attachments/assets/e09983a3-5445-41fc-b22b-44cc94e35c6d)
![image](https://github.com/user-attachments/assets/3fe67b69-902c-4630-81f2-4e6d1899553c)
![image](https://github.com/user-attachments/assets/cb0fe45f-f97a-43f8-9264-3c943b49408f)
![image](https://github.com/user-attachments/assets/acbbd800-725a-4703-9f6b-99a935c06c69)
![image](https://github.com/user-attachments/assets/37ff0720-332e-4872-a5b3-8284fb08a63b)
![image](https://github.com/user-attachments/assets/dc126952-5e09-4cc3-aec6-669370e7a29a)
<img width="1111" alt="image" src="https://github.com/user-attachments/assets/2e75fbb0-26ca-4a74-8c67-3c59fc8eb4d8" />
