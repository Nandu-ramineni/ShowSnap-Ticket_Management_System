import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Link } from "react-router-dom"
import Logo from "@/assets/logo.png"

const InitialLoginData = {
    email: "",
    password: ""
}

const Login = () => {
    const [data, setData] = useState(InitialLoginData)

    const handleChange = (e) => {
        setData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const submitHandler = (e) => {
        e.preventDefault()
        console.log(data)
    }


    return (
        <main className="flex justify-center items-center h-screen">
            <Card className="w-full max-w-sm m-auto">
                <div>
                    <img src={Logo} alt="logo" className="w-16 h-16 mx-auto " />
                    <div>
                        <h1 className="text-2xl font-bold text-center">CineVault!</h1>
                        <p className="text-center text-muted-foreground">Your seats. Your cinema.</p>
                    </div>
                </div>
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your credentials below!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="loginForm" onSubmit={submitHandler}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="flex items-center gap-2">

                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="hello@cinevault.com"
                                    required
                                    name="email"
                                    value={data.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Button variant="link">
                                        <Link
                                            to="/forgot-password"
                                            className="ml-auto inline-block text-sm "
                                        >
                                            Forgot your password?
                                        </Link>
                                    </Button>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    name="password"
                                    value={data.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button type="submit" className="w-full" form="loginForm" >
                        Login
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Button variant="link">
                            <Link to="/signup" className="ml-auto inline-block text-sm ">
                                Sign Up
                            </Link>
                        </Button>
                    </p>
                </CardFooter>
            </Card>
        </main>
    )
}

export default Login
