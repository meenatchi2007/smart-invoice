# Smart Invoice Manager

## Overview

Smart Invoice Manager is a modern full-stack web application developed to simplify invoice creation, customer management, and invoice tracking for businesses and freelancers. The application provides a centralized platform to create, update, organize, and monitor invoices while maintaining customer information in a secure and structured manner. It also supports PDF invoice generation and email delivery, helping users reduce manual effort, improve productivity, and maintain accurate business records.

The application is built using Next.js, React, TypeScript, GraphQL, Prisma ORM, PostgreSQL, and Tailwind CSS. It follows modern software engineering practices, including modular architecture, secure API development, efficient database management, environment-based configuration, and responsive user interface design. The scalable architecture ensures the application is easy to maintain and extend with future enhancements, making it a practical full-stack project that demonstrates real-world web development skills.

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
