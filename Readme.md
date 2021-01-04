# TeamUp, E-Cell, IITM

### About
[TeamUp](https://ecell.iitm.ac.in/event/team-up) is an event conducted by [Entrepreneurship Cell, IIT Madras](https://ecell.iitm.ac.in). The purpose of the event is to connect students with budding startups and collaborative projects. This portal was made to accompany the event. There were around ***433*** registrations through this portal.

### Portal Functionality
Students can use the portal **Student Dashboard** and get notified about selections. Mentors (which are preloaded in the database) can login and see who all have applied for their projects (which are also hardcoded in the database), shortlist and select them.

This repo is part of bigger repo that can't be made public. This monorepo only consists of the Students' part (called the **Student Dashboard** and acccompanying login and register functionalities) which was coded by me. The total project was made by me and a [colleague](https://github.com/ashishshroti14).

Main operations of the Student dashboard include: 
- Registering (with email verification).
- Logging In (with a *Forgot Password* feature).
- Editing info (including password).
- Uploading and updating profile image and CV.
- Browsing and applying for projects.

### Tech

**Frontend (React)**:
- Ant Design component library
- Redux and React Redux
- React Router
- Axios

**Backend (Node.js)**:
- Express as web framework.
- MongoDB as Database. Mongoose as ORM.

**Misc**
- AWS S3 for file storage. Files uploaded directly to S3 bucket from the client side via POST requests.
