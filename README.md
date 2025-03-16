# Wedding Finance Planner

A tactical tool for planning and tracking wedding finances. This application helps couples track expenses, allocate payments, and manage their wedding budget effectively.

## Features

- **Expense Tracking**: Track expenses across multiple categories (venue, food, drink, photography, dress, decorations, sound, and miscellaneous)
- **Payment Allocation**: Assign who has paid or will pay for each expense
- **Payment Scheduling**: Track payment deadlines and see upcoming payments
- **Gift Allocation**: Track monetary gifts and allocate them across different expenses
- **Summary Dashboard**: Get a quick overview of your wedding finances
- **Detailed Tables**: View comprehensive details of all expenses
- **Excel Export**: Generate reports in Excel format for record-keeping
- **Customizable Categories**: Add your own expense categories as needed
- **Firebase Integration**: All data is stored in Firebase Realtime Database

## Technology Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons and Heroicons
- **Database**: Firebase Realtime Database
- **Date Handling**: date-fns
- **Excel Export**: xlsx

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/wedding-planner-tool.git
cd wedding-planner-tool
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up Firebase
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Add a web app to your Firebase project
   - Enable Realtime Database in your Firebase project
   - Copy your Firebase configuration (apiKey, authDomain, etc.)
   - Create a `.env.local` file in the root directory and add your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Usage

### Firebase vs Demo Mode

The application has two modes:
- **Firebase Mode**: All data is stored in your Firebase Realtime Database
- **Demo Mode**: Uses mock data for demonstration purposes

You can toggle between these modes using the button in the top-right corner of the application.

### First-time Setup

When you first run the application in Firebase mode with an empty database, it will automatically populate the database with sample data to help you get started. You can then modify this data as needed.

### Adding Expenses

1. Navigate to the Expenses page
2. Click "Add Expense"
3. Fill in the expense details (title, amount, category, etc.)
4. Click "Save"

### Allocating Payments

1. Navigate to the Expenses page
2. Find the expense you want to allocate a payment to
3. Click "View Details"
4. Under the "Payment Allocations" section, click "Add Payment"
5. Select the contributor, enter the amount, and set the date
6. Click "Save"

### Tracking Gifts

1. Navigate to the Gifts page
2. Click "Add Gift"
3. Enter the gift details (from person, amount, date, etc.)
4. Click "Save"
5. To allocate a gift to an expense, click "View Details" on the gift
6. Click "Allocate to Expense"
7. Select the expense and enter the amount
8. Click "Save"

### Exporting Data

1. Navigate to the Dashboard
2. Click "Export to Excel"
3. Save the Excel file to your computer

## License

This project is licensed under the MIT License - see the LICENSE file for details.
