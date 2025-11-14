"use client";
import { type UseFormRegisterReturn } from "react-hook-form";

import { InputWrapper } from "@/components/ui/InputWrapper";

type AddressInputProps = {
  label: string;
  placeholder: string;
  register?: UseFormRegisterReturn;
  error?: string;
};

const AddressInput = ({
  label,
  placeholder,
  register,
  error,
}: AddressInputProps) => {
  return (
    <InputWrapper label={label} error={error}>
      <div className="py-2">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full h-10 bg-transparent outline-none text-foreground placeholder:text-placeholder text-2xl placeholder:text-4xl"
          {...register}
        />
      </div>
    </InputWrapper>
  );
};

export default AddressInput;
