'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActionState } from 'react';
import { login, signup } from '../actions';

type AuthState = { error: string | null };

const initialState: AuthState = { error: null };

interface Props {
  next?: string;
}

export function LoginForm({ next = '/' }: Props) {
  const [loginState, loginAction] = useActionState(
    async (state: AuthState, formData: FormData) => {
      return login(formData, next);
    },
    initialState
  );

  const [signupState, signupAction] = useActionState(
    async (state: AuthState, formData: FormData) => {
      return signup(formData, next);
    },
    initialState
  );

  return (
    <Tabs defaultValue='login' className='w-full'>
      <TabsList className='grid w-full grid-cols-2'>
        <TabsTrigger value='login'>Login</TabsTrigger>
        <TabsTrigger value='register'>Register</TabsTrigger>
      </TabsList>
      <TabsContent value='login'>
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <form action={loginAction}>
            <CardContent className='space-y-4'>
              {loginState?.error && (
                <Alert variant='destructive'>
                  <AlertDescription>{loginState.error}</AlertDescription>
                </Alert>
              )}
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' name='email' type='email' required />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input id='password' name='password' type='password' required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type='submit' className='w-full'>
                Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      <TabsContent value='register'>
        <Card>
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Enter your details below to create your account
            </CardDescription>
          </CardHeader>
          <form action={signupAction}>
            <CardContent className='space-y-4'>
              {signupState?.error && (
                <Alert variant='destructive'>
                  <AlertDescription>{signupState.error}</AlertDescription>
                </Alert>
              )}
              <div className='space-y-2'>
                <Label htmlFor='name'>Name</Label>
                <Input id='name' name='name' required />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' name='email' type='email' required />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input id='password' name='password' type='password' required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type='submit' className='w-full'>
                Create account
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
