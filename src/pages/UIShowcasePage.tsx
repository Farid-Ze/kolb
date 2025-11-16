/**
 * KLSI 4.0 - UI Showcase Page
 * Demonstrasi shadcn/ui components dengan Liquid Glass styling
 * 
 * Tasks 83-86: Refactored to use shadcn/ui components
 * - Button: shadcn/ui button with variants
 * - Input: shadcn/ui input with Label
 * - Select: shadcn/ui select
 * - Dialog: shadcn/ui dialog (replaces Modal)
 */

import React, { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { AppShell } from '../components/common/AppShell';
import { Skeleton, RouteErrorBoundary } from '../components/common';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Mail, Lock, Plus, Trash2, Search, Loader2 } from 'lucide-react';

export const UIShowcasePage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleToastDemo = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Data berhasil disimpan!',
      error: 'Terjadi kesalahan saat menyimpan data',
      warning: 'Sesi akan berakhir dalam 5 menit',
      info: 'Fitur baru telah tersedia',
    };
    
    toast[type](messages[type]);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleButtonLoading = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  const throwError = () => {
    throw new Error('Demo error untuk testing ErrorBoundary');
  };

  return (
    <AppShell showSidebar={true}>
      <div className="space-y-12">
        {/* Page Header */}
        <div className="material-regular rounded-xl p-8 space-y-2">
          <h1>UI Kit Showcase</h1>
          <p className="text-muted-foreground">
            Demonstrasi shadcn/ui dengan "Liquid Glass" Design System - Fase 6 Complete
          </p>
        </div>

        {/* Buttons Section (Task 83) */}
        <section className="space-y-6">
          <div className="material-thin rounded-xl p-6 space-y-4">
            <h2>Buttons (shadcn/ui)</h2>
            <p className="text-muted-foreground text-sm">
              Task 83: Custom Button replaced with shadcn/ui button
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="default" size="sm">
                Default Small
              </Button>
              <Button variant="default" size="default">
                Default Medium
              </Button>
              <Button variant="default" size="lg">
                Default Large
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="default" disabled>
                Disabled
              </Button>
              <Button variant="default" onClick={handleButtonLoading} disabled={buttonLoading}>
                {buttonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buttonLoading ? 'Loading...' : 'With Icon'}
              </Button>
            </div>
          </div>
        </section>

        {/* Inputs Section (Task 84) */}
        <section className="space-y-6">
          <div className="material-thin rounded-xl p-6 space-y-4">
            <h2>Inputs & Forms (shadcn/ui)</h2>
            <p className="text-muted-foreground text-sm">
              Task 84: Custom Input replaced with shadcn/ui input + Label
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">We'll never share your email</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-destructive">Password must be at least 8 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="disabled">Disabled Input</Label>
                <Input
                  id="disabled"
                  type="text"
                  placeholder="Disabled state"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="readonly">Read-only Input</Label>
                <Input
                  id="readonly"
                  type="text"
                  value="Read-only value"
                  readOnly
                />
              </div>
            </div>
          </div>
        </section>

        {/* Select Section (Task 86) */}
        <section className="space-y-6">
          <div className="material-thin rounded-xl p-6 space-y-4">
            <h2>Select Dropdown (shadcn/ui)</h2>
            <p className="text-muted-foreground text-sm">
              Task 86: Custom Select replaced with shadcn/ui select
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Indonesia</SelectItem>
                    <SelectItem value="sg">Singapore</SelectItem>
                    <SelectItem value="my">Malaysia</SelectItem>
                    <SelectItem value="th">Thailand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="MEDIATOR">Mediator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-destructive">Please select a role</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dialog Section (Task 85) */}
        <section className="space-y-6">
          <div className="material-thin rounded-xl p-6 space-y-4">
            <h2>Dialog Modal (shadcn/ui)</h2>
            <p className="text-muted-foreground text-sm">
              Task 85: Custom Modal replaced with shadcn/ui dialog
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Demo Dialog</DialogTitle>
                  <DialogDescription>
                    Ini adalah dialog dengan Liquid Glass styling (backdrop-blur applied).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Dialog memiliki fitur:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Backdrop blur dengan dimming layer</li>
                    <li>Escape key untuk close</li>
                    <li>Focus trap untuk accessibility</li>
                    <li>Smooth animations</li>
                    <li>Reduce motion fallback</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success('Action confirmed!');
                      setIsDialogOpen(false);
                    }}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Toast Section */}
        <section className="space-y-6">
          <div className="material-thin rounded-xl p-6 space-y-4">
            <h2>Toast Notifications (Sonner)</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                onClick={() => handleToastDemo('success')}
              >
                Success Toast
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleToastDemo('error')}
              >
                Error Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleToastDemo('warning')}
              >
                Warning Toast
              </Button>
              <Button
                variant="outline"
                onClick={() => handleToastDemo('info')}
              >
                Info Toast
              </Button>
            </div>
          </div>
        </section>

        {/* Skeleton Loaders Section */}
        <section className="space-y-6">
          <div className="material-thin rounded-xl p-6 space-y-4">
            <h2>Skeleton Loaders</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button onClick={handleLoadingDemo}>
                  Toggle Loading (2s)
                </Button>
                {isLoading && <span className="text-sm text-muted-foreground">Loading...</span>}
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="90%" />
                  <div className="flex gap-3">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="60%" />
                    </div>
                  </div>
                  <Skeleton variant="rectangular" height={200} />
                </div>
              ) : (
                <div className="glass-regular rounded-xl p-6 space-y-3">
                  <h3>Content Loaded</h3>
                  <p className="text-muted-foreground">
                    This is the actual content that appears after loading.
                  </p>
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p>Data Item</p>
                      <p className="text-sm text-muted-foreground">Description text here</p>
                    </div>
                  </div>
                  <div className="h-48 bg-gradient-to-br from-chart-1/20 to-chart-2/20 rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Chart or Image Placeholder</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Error Boundary Section */}
        <section className="space-y-6">
          <div className="material-thin rounded-xl p-6 space-y-4">
            <h2>Error Boundary</h2>
            <p className="text-muted-foreground">
              Click the button below to simulate an error and test the error boundary.
            </p>
            <RouteErrorBoundary>
              <Button variant="destructive" onClick={throwError}>
                Throw Error (Demo)
              </Button>
            </RouteErrorBoundary>
          </div>
        </section>

        {/* Material Variants Section */}
        <section className="space-y-6">
          <div className="space-y-4">
            <h2>Material Variants (Liquid Glass)</h2>
            
            <div className="glass-regular rounded-xl p-6 space-y-2">
              <h3>Glass Regular</h3>
              <p className="text-muted-foreground">
                Navigation & control layer material dengan backdrop blur dan transparency
              </p>
            </div>
            
            <div className="glass-clear rounded-xl p-6 space-y-2">
              <h3>Glass Clear</h3>
              <p className="text-muted-foreground">
                Sangat transparan untuk media-rich backgrounds
              </p>
            </div>
            
            <div className="material-thin rounded-xl p-6 space-y-2">
              <h3>Material Thin</h3>
              <p className="text-muted-foreground">
                Content layer material - semi-transparent
              </p>
            </div>
            
            <div className="material-regular rounded-xl p-6 space-y-2">
              <h3>Material Regular</h3>
              <p className="text-muted-foreground">
                Content layer material - default opacity
              </p>
            </div>
            
            <div className="material-thick rounded-xl p-6 space-y-2">
              <h3>Material Thick</h3>
              <p className="text-muted-foreground">
                Content layer material - high opacity dengan shadow
              </p>
            </div>
          </div>
        </section>

        {/* Cards Grid Section */}
        <section className="space-y-6">
          <h2>Card Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-regular rounded-xl p-6 space-y-4 transition-spring hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3>Card Title {i}</h3>
                  <p className="text-sm text-muted-foreground">
                    Card description with interactive hover effects
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  Action Button
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Info Footer */}
        <div className="material-thin rounded-xl p-6 border-l-4 border-l-chart-2 space-y-2">
          <h4>
            Fase 6 Complete ✅
          </h4>
          <p className="text-muted-foreground text-sm">
            Tasks 83-86 Complete: Semua custom components (Button, Input, Select, Modal) telah 
            di-refactor menggunakan shadcn/ui dengan Liquid Glass styling sesuai Guidelines.md.
          </p>
        </div>
      </div>
    </AppShell>
  );
};
