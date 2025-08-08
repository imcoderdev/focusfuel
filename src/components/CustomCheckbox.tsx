"use client";

import { motion } from "framer-motion";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

export default function CustomCheckbox({ checked, onChange }: CustomCheckboxProps) {
  return (
    <motion.div
      className={`
        w-6 h-6 rounded-full border-2 cursor-pointer transition-colors duration-200 flex items-center justify-center
        ${checked 
          ? 'bg-emerald-500 border-emerald-500' 
          : 'bg-transparent border-slate-500 hover:border-slate-400'
        }
      `}
      onClick={onChange}
      whileTap={{ scale: 0.9 }}
      animate={{ scale: checked ? [1, 1.2, 1] : 1 }}
      transition={{ duration: 0.2 }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="overflow-visible"
      >
        <motion.path
          d="M3 8L7 12L13 4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            delay: checked ? 0.1 : 0
          }}
        />
      </svg>
    </motion.div>
  );
}
