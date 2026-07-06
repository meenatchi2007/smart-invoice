# Smart Invoice Manager

## Overview

Smart Invoice Manager is a modern full-stack web application designed to streamline invoice creation and customer management. It provides an efficient platform for generating professional invoices, organizing customer information, and managing invoice records through an intuitive and responsive interface.

The application is built using a modern technology stack, including Next.js, React, TypeScript, GraphQL, Prisma ORM, PostgreSQL, and Tailwind CSS. It follows industry-standard software development practices with a scalable architecture and responsive user interface.

---

## Features

- User authentication and authorization
- Create, update, and delete invoices
- Customer management
- Generate professional PDF invoices
- Email invoices to customers
- Invoice status tracking
- Dashboard with invoice summary
- Responsive user interface
- GraphQL API implementation
- Database management using Prisma ORM

---

## Technology Stack

| Category | Technologies |
|----------|--------------|
| Frontend | Next.js, React, TypeScript |
| Backend | Next.js API Routes, GraphQL |
| Database | PostgreSQL, Prisma ORM |
| Styling | Tailwind CSS |
| Version Control | Git, GitHub |

---

## Project Structure

```text
smart-invoice-manager/
│
├── app/
├── components/
├── graphql/
├── lib/
├── prisma/
├── public/
├── store/
├── package.json
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/meenatchi2007/smart-invoice.git
```

### Navigate to the project directory

```bash
cd smart-invoice
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the project root and configure the required environment variables.

Example:

```env
DATABASE_URL=
AUTH_SECRET=
```

### Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Application Modules

- Authentication
- Dashboard
- Customer Management
- Invoice Management
- PDF Generation
- Email Notifications

---

## Future Enhancements

- Multi-user support
- Advanced analytics dashboard
- Invoice templates
- Mobile application
- Multi-currency support
- Export reports to Excel and CSV

---

## Author

**Meenatchi M**

B.Tech Artificial Intelligence and Data Science

GitHub: https://github.com/meenatchi2007

---

## License

This project is developed for learning, academic, and portfolio purposes.
