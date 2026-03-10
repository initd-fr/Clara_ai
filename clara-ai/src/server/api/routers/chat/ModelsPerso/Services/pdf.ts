// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import puppeteer from "puppeteer";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
export const pdfRouter = createTRPCRouter({
  //& Generate PDF
  generatePDF: protectedProcedure
    .input(
      z.object({
        htmlContent: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { htmlContent } = input;

      try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: "A4" });
        await browser.close();

        return {
          pdf: pdfBuffer.toString("base64"),
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la génération du PDF.",
        });
      }
    }),
});
