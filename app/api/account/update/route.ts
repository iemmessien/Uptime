import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, generateToken, setAuthCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[API /api/account/update] POST request received');
  
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, username, currentPassword, newPassword } = body;

    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required' },
        { status: 400 }
      );
    }

    // Get current admin user
    const admin = await prisma.admin.findUnique({
      where: { id: user.userId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    }

    // Check if email or username is already taken by another user
    if (email !== admin.email) {
      const emailExists = await prisma.admin.findFirst({
        where: {
          email,
          NOT: { id: user.userId },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }
    }

    if (username !== admin.username) {
      const usernameExists = await prisma.admin.findFirst({
        where: {
          username,
          NOT: { id: user.userId },
        },
      });

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Username is already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      username,
    };

    // Hash new password if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Update admin user
    const updatedAdmin = await prisma.admin.update({
      where: { id: user.userId },
      data: updateData,
    });

    // Generate new token with updated username
    const token = generateToken({
      userId: updatedAdmin.id,
      username: updatedAdmin.username,
      email: updatedAdmin.email,
    });

    await setAuthCookie(token);

    console.log('[API /api/account/update] Account updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('[API /api/account/update] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating account' },
      { status: 500 }
    );
  }
}
