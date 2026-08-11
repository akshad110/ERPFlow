import bcrypt from "bcryptjs";


export const hashPassword = async (
    password: string
):Promise<string> => {
    const salt = 12;

    return bcrypt.hash(password,salt);
};

export const comparePassword = async (
    password:string,
    passwordHash:string
): Promise<boolean> => {
    return bcrypt.compare(password,passwordHash);
};