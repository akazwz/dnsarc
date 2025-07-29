import { useForm } from 'react-hook-form'
import {z} from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Link } from 'react-router'

const schema = z.object({
    email: z.email(),
    password: z.string().min(8),
})

export default function Login() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
        email: '',
        password: '',
    },
  })

  function onSubmit(values: z.infer<typeof schema>) {
    console.log(values)
  }

  return (
    <div className="p-2 flex flex-col h-dvh justify-center">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm mx-auto w-full space-y-4">
                <div className="flex flex-col gap-2 justify-center items-center mb-4">
                    <h1 className="text-xl font-bold">Welcome back</h1>
                    <span className="text-sm text-muted-foreground">
                        Enter your email and password to login
                    </span>
                </div>
                <FormField
                control={form.control}
                name="email"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full">Login</Button>
                <div className="flex justify-center items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Don't have an account?
                    </span>
                    <Link to="/register" className="text-sm text-primary underline">
                        Register
                    </Link>
                </div>
            </form>
        </Form>
    </div>
  )
}