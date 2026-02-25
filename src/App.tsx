import FamilyTree from './components/FamilyTree';
import AuthGuard from './components/AuthGuard';

export default function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <FamilyTree />
      <AuthGuard />
    </div>
  );
}
