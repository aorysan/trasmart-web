"use client";
import { use, useState } from "react";
import Link from "next/link"; 
import styles from "./register.module.scss";
import Image from "next/image";

export default function Register(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    
    return (
        <div className={styles.main}>
            <div className={styles.registerContainer}>
                <div className={styles.registerImage}>
                    <Image
                        src="/register-image.svg"
                        alt="Register Image"
                        width={400}
                        height={400}
                    />
                </div>
                <div className={styles.registerForm}>
                    
                </div>
            </div>
        </div>
    )
}