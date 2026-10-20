import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ----------------------------------------------------------------------
// GET: Fetch lessons for a specific course (and check user progress)
// Endpoint: /api/lessons?courseId=xxx&userId=yyy
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Fetch lessons belonging to the course's chapters
    const lessons = await prisma.lesson.findMany({
      where: {
        chapter: {
          courseId: courseId,
        },
        isPublished: true,
      },
      orderBy: { position: "asc" },
      include: {
        chapter: {
          select: { title: true },
        },
        ...(userId && {
          userProgress: {
            where: { userId },
            select: { isCompleted: true },
          },
        }),
      },
    });

    // Map database fields to match your frontend Lesson interface
    const formattedLessons = lessons.map((lesson) => {
      const isCompleted =
        userId && lesson.userProgress
          ? lesson.userProgress.length > 0 && lesson.userProgress[0].isCompleted
          : false;

      return {
        id: lesson.id, // string or number depending on your schema (Prisma standard is string/cuid)
        title: lesson.title,
        duration: `${lesson.duration} min`,
        video: lesson.videoUrl || "",
        completed: isCompleted,
      };
    });

    return NextResponse.json(formattedLessons, { status: 200 });
  } catch (error: any) {
    console.error("[GET_LESSONS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PATCH: Mark a lesson as complete/incomplete for a user
// Endpoint: /api/lessons/progress
// ----------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { lessonId, userId, isCompleted } = body;

    if (!lessonId || !userId) {
      return NextResponse.json({ error: "lessonId and userId are required" }, { status: 400 });
    }

    // Upsert user progress record in Prisma
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        isCompleted,
      },
      create: {
        userId,
        lessonId,
        isCompleted,
      },
    });

    return NextResponse.json({ success: true, progress }, { status: 200 });
  } catch (error: any) {
    console.error("[UPDATE_PROGRESS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}