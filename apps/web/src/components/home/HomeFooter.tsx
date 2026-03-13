import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const columns = [
  {
    heading: 'Learn',
    links: [
      { label: 'Browse All Courses', to: '/courses' },
      { label: 'Free Courses', to: '/courses?filter=free' },
      { label: 'Crop Farming', to: '/courses?categoryId=crop-farming' },
      { label: 'Livestock', to: '/courses?categoryId=livestock' },
      { label: 'Soil Health', to: '/courses?categoryId=soil-health' },
      { label: 'Pest Control', to: '/courses?categoryId=pest-control' },
    ],
  },
  {
    heading: 'Teach',
    links: [
      { label: 'Become an Instructor', to: '/register' },
      { label: 'Instructor FAQ', to: '#' },
      { label: 'Revenue Share', to: '#' },
      { label: 'Course Guidelines', to: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About FarmWise', to: '#' },
      { label: 'Blog', to: '#' },
      { label: 'Press', to: '#' },
      { label: 'Careers', to: '#' },
      { label: 'Contact', to: '#' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Centre', to: '#' },
      { label: 'Offline Guide', to: '#' },
      { label: 'Refund Policy', to: '#' },
      { label: 'Privacy Policy', to: '#' },
      { label: 'Terms of Service', to: '#' },
    ],
  },
];

export function HomeFooter() {
  return (
    <footer className="bg-[#1A2E1A] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-400 hover:text-white transition-colors block py-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-[#4CAF50]" />
            <span className="font-bold text-lg">FarmWise</span>
            <span className="text-gray-400 text-sm ml-2">
              Growing Knowledge, Growing Harvests.
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} FarmWise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
