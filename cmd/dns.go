package cmd

import (
	"log/slog"
	"os"

	"github.com/spf13/cobra"

	"dnsarc/internal/dns"
)

var dnsCmd = &cobra.Command{
	Use:   "dns",
	Short: "Start the DNS server",
	Long:  `Start the DNS server that handles DNS queries and resolves records from the database.`,
	Run: func(cmd *cobra.Command, args []string) {
		server := dns.NewServer()
		if err := server.Start(); err != nil {
			slog.Error("failed to start DNS server", "error", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.AddCommand(dnsCmd)
}
