# Smart Invoice Manager

## Overview

Smart Invoice Manager is a full-stack web application developed to simplify invoice creation, management, and payment tracking. The application enables users to generate professional invoices, manage customer information, process secure online payments, and maintain invoice records through an intuitive and responsive interface.

The project is built using modern web technologies including Next.js, TypeScript, Prisma, GraphQL, and Stripe, following industry-standard development practices.

---

## Features

- User authentication and authorization
- Create, update, and delete invoices
- Customer management
- Generate professional PDF invoices
- Email invoices to customers
- Secure online payment integration using Stripe
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
| Payments | Stripe |
| Email Service | Resend |
| PDF Generation | PDF Generator |
| Version Control | Git, GitHub |

---

## Project Structure

```
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

```
DATABASE_URL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```

### Start the development server

```bash
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

---

## Application Modules

- Authentication
- Dashboard
- Customer Management
- Invoice Management
- Payment Processing
- PDF Generation
- Email Notifications

---

## Future Enhancements

- Multi-user organization support
- Advanced analytics dashboard
- GST and tax report generation
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
