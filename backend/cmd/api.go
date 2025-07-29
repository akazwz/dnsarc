package cmd

import (
	"log/slog"
	"os"

	"github.com/spf13/cobra"

	"dnsarc/internal/api"
)

var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "Start the API server",
	Long:  `Start the API server that handles API requests and resolves records from the database.`,
	Run: func(cmd *cobra.Command, args []string) {
		server := api.NewServer()
		if err := server.Start(); err != nil {
			slog.Error("failed to start API server", "error", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.AddCommand(apiCmd)
}
