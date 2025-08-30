import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-600">
          <p className="text-sm">
            © 2024 RentShare. All rights reserved. | 
            <Link href="/signup" className="text-green-600 hover:text-green-800 ml-2 font-medium hover:underline transition-colors duration-200">
              Join our rental community
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
