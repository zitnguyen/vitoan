import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

// Trang 404: cú "lạc đường" + la bàn, gợi ý quay về trang chủ hoặc vào học.
export default function NotFoundPage() {
  const { user } = useAuth();
  const learnTo = user?.grade?.slug ? `/lop/${user.grade.slug}` : "/#chon-lop";
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-14 text-center">
      <div className="relative">
        <span className="font-display text-[8rem] font-black leading-none text-[#0b2340]/10 sm:text-[11rem]">404</span>
        <OwlMascot className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 sm:h-40 sm:w-40" shake />
        <Img3D name="compass" className="absolute -right-2 top-2 h-14 w-14 animate-[float-soft_4s_ease-in-out_infinite]" />
        <Img3D name="question" className="absolute -left-2 bottom-4 h-12 w-12 animate-[float-soft_5s_ease-in-out_infinite]" />
      </div>
      <h1 className="mt-2 font-display text-3xl font-black text-[#0b2340] sm:text-4xl">Ối, cú bị lạc đường rồi!</h1>
      <p className="mt-3 max-w-md text-lg font-semibold text-slate-500">Trang em tìm không có ở đây. Mình cùng quay lại học tiếp nhé!</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-display text-lg font-black text-white shadow-[0_5px_0_0_#049245] transition hover:-translate-y-0.5">
          <Img3D name="house" className="h-6 w-6" /> Về trang chủ
        </Link>
        <Link to={learnTo} className="flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-display text-lg font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-primary">
          <Img3D name="books" className="h-6 w-6" /> Vào học
        </Link>
      </div>
    </div>
  );
}
