export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6 text-lg">Sorry, the page you are looking for does not exist.</p>
      <a href="/" className="btn btn-primary">
        Go Home
      </a>
    </div>
  );
} 