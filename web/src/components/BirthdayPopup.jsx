import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const DISMISSED_KEY = "birthday_popup_dismissed";

export default function BirthdayPopup() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.birthdayToday) return;
    const today = new Date().toDateString();
    if (sessionStorage.getItem(DISMISSED_KEY) !== today) {
      setVisible(true);
    }
  }, [user]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, new Date().toDateString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="text-7xl leading-none">🎂</div>
        <div className="mt-2 flex justify-center gap-1 text-2xl">
          <span>🎉</span><span>🎈</span><span>🎊</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Happy Birthday, {user.first_name}!
        </h2>
        <p className="mt-2 text-slate-500 leading-relaxed">
          Wishing you a wonderful day filled with joy and happiness. From everyone at Kidz Galaxy!
        </p>
        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600 active:scale-95"
        >
          Thank You! 🎈
        </button>
      </div>
    </div>
  );
}
