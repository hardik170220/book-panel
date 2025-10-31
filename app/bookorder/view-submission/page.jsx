// app/pages/bookorder/page.js
import DynamicBookOrderPage from '../../../components/submission-components/BookOrderPage';
import { Suspense } from 'react';

export default function BookOrder() {
  return (
    <Suspense fallback={<div className='h-screen animate-pulse flex flex-col items-center justify-center'><img className='w-16' src="/logo.png" alt="" /> <span className='font-sans font-semibold text-lg'>Loading the Book Orders ...</span></div>}>
      <DynamicBookOrderPage />
    </Suspense>
  );
}